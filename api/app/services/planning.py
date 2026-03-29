import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Order, StopDelivery, Trip, TripStop
from app.services.events import append_event


def plan_trip(
    db: Session,
    org_id: uuid.UUID,
    warehouse_location_id: uuid.UUID,
    order_ids: list[uuid.UUID],
    vehicle_id: uuid.UUID | None,
    driver_id: uuid.UUID | None,
    planned_start,
    actor_user_id: uuid.UUID | None = None,
) -> Trip:
    orders = (
        db.execute(
            select(Order)
            .where(Order.id.in_(order_ids), Order.org_id == org_id)
            .options(joinedload(Order.lines))
        )
        .scalars()
        .unique()
        .all()
    )
    if len(orders) != len(order_ids):
        raise ValueError("One or more orders not found")
    for o in orders:
        if o.status != "ready_to_ship":
            raise ValueError(f"Order {o.id} must be ready_to_ship")
        if o.warehouse_location_id != warehouse_location_id:
            raise ValueError("Order warehouse mismatch")

    by_retailer: dict[uuid.UUID, list[Order]] = defaultdict(list)
    for o in orders:
        by_retailer[o.retailer_location_id].append(o)

    trip = Trip(
        org_id=org_id,
        warehouse_location_id=warehouse_location_id,
        status="planned",
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        planned_start=planned_start,
    )
    db.add(trip)
    db.flush()

    seq = 0
    for retailer_id in sorted(by_retailer.keys(), key=lambda x: str(x)):
        group = by_retailer[retailer_id]
        seq += 1
        stop = TripStop(
            trip_id=trip.id,
            sequence=seq,
            location_id=retailer_id,
            status="pending",
        )
        db.add(stop)
        db.flush()
        for order in group:
            for line in order.lines:
                if line.qty_allocated <= 0:
                    continue
                db.add(
                    StopDelivery(
                        trip_stop_id=stop.id,
                        order_line_id=line.id,
                        qty_planned=line.qty_allocated,
                        status="pending",
                    )
                )

    for o in orders:
        o.status = "in_fulfillment"

    append_event(
        db,
        "TripPlanned",
        {"trip_id": str(trip.id), "order_ids": [str(x) for x in order_ids]},
        org_id=org_id,
        actor_user_id=actor_user_id,
    )
    return trip
