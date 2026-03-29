import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import InventoryBalance, Order, OrderLine, StopDelivery, Trip, TripStop
from app.services.events import append_event


def _warehouse_for_trip(trip: Trip) -> uuid.UUID:
    return trip.warehouse_location_id


def apply_stop_delivery(
    db: Session,
    trip: Trip,
    stop: TripStop,
    item: StopDelivery,
    qty_delivered: float,
    status: str,
    reason_code: str | None,
    signature_url: str | None,
    photo_url: str | None,
) -> None:
    warehouse_id = _warehouse_for_trip(trip)
    line = db.get(OrderLine, item.order_line_id)
    if not line:
        raise ValueError("Order line missing")

    inv = db.execute(
        select(InventoryBalance).where(
            InventoryBalance.location_id == warehouse_id,
            InventoryBalance.sku_id == line.sku_id,
        ).with_for_update()
    ).scalar_one_or_none()
    if not inv:
        raise ValueError("Inventory row missing")

    qty = min(qty_delivered, item.qty_planned)
    reduce_reserved = min(qty, inv.reserved)
    inv.reserved -= reduce_reserved
    inv.on_hand -= qty

    item.qty_delivered = qty
    item.status = status
    item.reason_code = reason_code
    item.signature_url = signature_url
    item.photo_url = photo_url
    item.pod_captured_at = datetime.now(timezone.utc)

    if status == "delivered" and qty >= item.qty_planned:
        line.status = "delivered"
    elif status == "partial":
        line.status = "shipped"
    elif status == "failed":
        pass


def refresh_order_status(db: Session, order_id: uuid.UUID) -> None:
    lines = db.execute(select(OrderLine).where(OrderLine.order_id == order_id)).scalars().all()
    if not lines:
        return
    order = db.get(Order, order_id)
    if not order:
        return
    if all(ln.status == "delivered" for ln in lines):
        order.status = "delivered"
    elif any(ln.status == "delivered" for ln in lines):
        order.status = "shipped"


def mark_trip_completed_if_all_stops_done(db: Session, trip: Trip) -> None:
    stops = db.execute(select(TripStop).where(TripStop.trip_id == trip.id)).scalars().all()
    for stop in stops:
        deliveries = db.execute(select(StopDelivery).where(StopDelivery.trip_stop_id == stop.id)).scalars().all()
        for d in deliveries:
            if d.status == "pending":
                return
    trip.status = "completed"
    trip.completed_at = datetime.now(timezone.utc)
