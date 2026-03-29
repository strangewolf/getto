import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import OrderLine, StopDelivery, Trip, TripCost, TripStop, User
from app.schemas.trip import DeliverBody, PlanTripRequest, StopDeliveryOut, TripOut, TripStopOut, TripSummary
from app.services.delivery import apply_stop_delivery, mark_trip_completed_if_all_stops_done, refresh_order_status
from app.services.events import append_event
from app.services.planning import plan_trip

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripSummary])
def list_trips(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[TripSummary]:
    rows = db.execute(select(Trip).where(Trip.org_id == current.org_id).order_by(Trip.created_at.desc())).scalars().all()
    return [
        TripSummary(
            id=t.id,
            status=t.status,
            warehouse_location_id=t.warehouse_location_id,
            vehicle_id=t.vehicle_id,
            driver_id=t.driver_id,
            created_at=t.created_at,
        )
        for t in rows
    ]


def _trip_out(db: Session, trip: Trip) -> TripOut:
    trip = db.execute(
        select(Trip)
        .where(Trip.id == trip.id)
        .options(joinedload(Trip.stops).joinedload(TripStop.deliveries))
    ).scalar_one()
    stops = sorted(trip.stops, key=lambda s: s.sequence)
    return TripOut(
        id=trip.id,
        org_id=trip.org_id,
        warehouse_location_id=trip.warehouse_location_id,
        status=trip.status,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        planned_start=trip.planned_start,
        dispatched_at=trip.dispatched_at,
        completed_at=trip.completed_at,
        created_at=trip.created_at,
        stops=[
            TripStopOut(
                id=s.id,
                sequence=s.sequence,
                location_id=s.location_id,
                status=s.status,
                eta=s.eta,
                arrived_at=s.arrived_at,
                deliveries=[StopDeliveryOut.model_validate(d) for d in s.deliveries],
            )
            for s in stops
        ],
    )


@router.post("/plan", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def post_plan(
    body: PlanTripRequest,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    try:
        trip = plan_trip(
            db,
            current.org_id,
            body.warehouse_location_id,
            body.order_ids,
            body.vehicle_id,
            body.driver_id,
            body.planned_start,
            actor_user_id=current.id,
        )
        db.commit()
        db.refresh(trip)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _trip_out(db, trip)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.org_id == current.org_id)
    ).scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return _trip_out(db, trip)


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def post_dispatch(
    trip_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in ("planned", "draft"):
        raise HTTPException(status_code=400, detail="Trip cannot be dispatched in current status")
    if not trip.vehicle_id or not trip.driver_id:
        raise HTTPException(status_code=400, detail="Assign vehicle and driver before dispatch")
    trip.status = "dispatched"
    trip.dispatched_at = datetime.now(timezone.utc)
    append_event(
        db,
        "TripDispatched",
        {"trip_id": str(trip.id)},
        org_id=trip.org_id,
        actor_user_id=current.id,
    )
    db.commit()
    return _trip_out(db, trip)


@router.post("/{trip_id}/stops/{stop_id}/arrive", response_model=TripOut)
def post_arrive(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    stop = db.get(TripStop, stop_id)
    if not stop or stop.trip_id != trip.id:
        raise HTTPException(status_code=404, detail="Stop not found")
    stop.status = "arrived"
    stop.arrived_at = datetime.now(timezone.utc)
    trip.status = "enroute"
    append_event(db, "StopArrived", {"trip_id": str(trip.id), "stop_id": str(stop.id)}, org_id=trip.org_id, actor_user_id=current.id)
    db.commit()
    return _trip_out(db, trip)


@router.post("/{trip_id}/stops/{stop_id}/deliver", response_model=TripOut)
def post_deliver(
    trip_id: uuid.UUID,
    stop_id: uuid.UUID,
    body: DeliverBody,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    stop = db.get(TripStop, stop_id)
    if not stop or stop.trip_id != trip.id:
        raise HTTPException(status_code=404, detail="Stop not found")

    for line in body.deliveries:
        item = db.get(StopDelivery, line.stop_delivery_id)
        if not item or item.trip_stop_id != stop.id:
            raise HTTPException(status_code=400, detail="Invalid stop delivery")
        try:
            apply_stop_delivery(
                db,
                trip,
                stop,
                item,
                line.qty_delivered,
                line.status,
                line.reason_code,
                line.signature_url,
                line.photo_url,
            )
            line_obj = db.get(OrderLine, item.order_line_id)
            if line_obj:
                refresh_order_status(db, line_obj.order_id)
            append_event(
                db,
                "PODCaptured",
                {"stop_delivery_id": str(item.id), "qty": line.qty_delivered},
                org_id=trip.org_id,
                actor_user_id=current.id,
            )
        except ValueError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e)) from e

    stop.status = "completed"
    mark_trip_completed_if_all_stops_done(db, trip)
    db.commit()
    trip = db.get(Trip, trip_id)
    return _trip_out(db, trip)


@router.post("/{trip_id}/complete", response_model=TripOut)
def post_complete(
    trip_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    mark_trip_completed_if_all_stops_done(db, trip)
    db.commit()
    return _trip_out(db, trip)


class TripCostIn(BaseModel):
    category: str
    amount: float
    currency: str = "INR"
    notes: str | None = None


class TripAssignIn(BaseModel):
    vehicle_id: uuid.UUID | None = None
    driver_id: uuid.UUID | None = None


@router.patch("/{trip_id}", response_model=TripOut)
def patch_trip(
    trip_id: uuid.UUID,
    body: TripAssignIn,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in ("draft", "planned"):
        raise HTTPException(status_code=400, detail="Cannot reassign vehicle/driver in current status")
    if body.vehicle_id is not None:
        trip.vehicle_id = body.vehicle_id
    if body.driver_id is not None:
        trip.driver_id = body.driver_id
    db.commit()
    return _trip_out(db, trip)


@router.post("/{trip_id}/costs", response_model=dict)
def post_trip_cost(
    trip_id: uuid.UUID,
    body: TripCostIn,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> dict:
    trip = db.get(Trip, trip_id)
    if not trip or trip.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    existing = db.execute(select(TripCost).where(TripCost.trip_id == trip_id, TripCost.category == body.category)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Cost for this category already posted for trip")
    tc = TripCost(
        trip_id=trip_id,
        category=body.category,
        amount=body.amount,
        currency=body.currency,
        notes=body.notes,
    )
    db.add(tc)
    append_event(db, "CostPosted", {"trip_id": str(trip_id), "category": body.category, "amount": body.amount}, org_id=trip.org_id, actor_user_id=current.id)
    db.commit()
    return {"id": str(tc.id), "trip_id": str(trip_id), "amount": body.amount, "category": body.category}
