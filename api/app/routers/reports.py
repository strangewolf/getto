from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import StopDelivery, Trip, TripStop, User

router = APIRouter(prefix="/reports", tags=["reports"])


class OtdReport(BaseModel):
    window_days: int
    on_time_rate: float
    total_deliveries: int
    late_or_failed: int


class UtilizationReport(BaseModel):
    avg_stops_per_trip: float
    trips_in_period: int
    completed_trips: int


class ExceptionsReport(BaseModel):
    failed_or_partial_stops: int
    total_stops: int


@router.get("/otd", response_model=OtdReport)
def report_otd(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    days: int = 30,
) -> OtdReport:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    total = db.execute(
        select(func.count(StopDelivery.id)).where(
            StopDelivery.status.in_(("delivered", "partial", "failed")),
            StopDelivery.pod_captured_at.isnot(None),
            StopDelivery.pod_captured_at >= since,
        )
    ).scalar() or 0
    failed = db.execute(
        select(func.count(StopDelivery.id)).where(
            StopDelivery.status.in_(("failed", "partial")),
            StopDelivery.pod_captured_at.isnot(None),
            StopDelivery.pod_captured_at >= since,
        )
    ).scalar() or 0
    ok = max(0, int(total) - int(failed))
    rate = float(ok) / float(total) if total else 1.0
    return OtdReport(window_days=days, on_time_rate=rate, total_deliveries=int(total), late_or_failed=int(failed))


@router.get("/utilization", response_model=UtilizationReport)
def report_utilization(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    days: int = 30,
) -> UtilizationReport:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    trips = db.execute(select(Trip).where(Trip.org_id == current.org_id, Trip.created_at >= since)).scalars().all()
    if not trips:
        return UtilizationReport(avg_stops_per_trip=0.0, trips_in_period=0, completed_trips=0)
    completed = [t for t in trips if t.status == "completed"]
    stops_counts: list[int] = []
    for t in trips:
        n = db.execute(select(func.count()).select_from(TripStop).where(TripStop.trip_id == t.id)).scalar() or 0
        stops_counts.append(int(n))
    avg = sum(stops_counts) / len(stops_counts) if stops_counts else 0.0
    return UtilizationReport(
        avg_stops_per_trip=avg,
        trips_in_period=len(trips),
        completed_trips=len(completed),
    )


@router.get("/exceptions", response_model=ExceptionsReport)
def report_exceptions(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    days: int = 30,
) -> ExceptionsReport:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    total_stops = db.execute(
        select(func.count(TripStop.id))
        .join(Trip, Trip.id == TripStop.trip_id)
        .where(Trip.org_id == current.org_id, TripStop.arrived_at.isnot(None), TripStop.arrived_at >= since)
    ).scalar() or 0
    bad = db.execute(
        select(func.count(StopDelivery.id))
        .join(TripStop, TripStop.id == StopDelivery.trip_stop_id)
        .join(Trip, Trip.id == TripStop.trip_id)
        .where(
            Trip.org_id == current.org_id,
            StopDelivery.status.in_(("failed", "partial")),
            StopDelivery.pod_captured_at >= since,
        )
    ).scalar() or 0
    return ExceptionsReport(failed_or_partial_stops=int(bad), total_stops=int(total_stops))
