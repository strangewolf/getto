import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Allocation, InventoryBalance, Order, OrderLine
from app.services.events import append_event


def allocate_order(db: Session, order_id: uuid.UUID, actor_user_id: uuid.UUID | None = None) -> Order:
    order = db.execute(
        select(Order).where(Order.id == order_id).options(joinedload(Order.lines))
    ).scalar_one_or_none()
    if not order:
        raise ValueError("Order not found")
    if order.status in ("shipped", "delivered", "cancelled"):
        raise ValueError("Order cannot be allocated in current status")

    warehouse_id = order.warehouse_location_id

    for line in order.lines:
        need = line.qty_requested - line.qty_allocated
        if need <= 0:
            continue

        inv = db.execute(
            select(InventoryBalance).where(
                InventoryBalance.location_id == warehouse_id,
                InventoryBalance.sku_id == line.sku_id,
            ).with_for_update()
        ).scalar_one_or_none()
        if not inv:
            continue

        available = inv.on_hand - inv.reserved
        take = min(need, max(0.0, available))
        if take <= 0:
            continue

        inv.reserved += take
        line.qty_allocated += take
        db.add(
            Allocation(
                order_line_id=line.id,
                inventory_balance_id=inv.id,
                qty=take,
            )
        )
        if line.qty_allocated >= line.qty_requested:
            line.status = "allocated"
        elif line.qty_allocated > 0:
            line.status = "allocated"

    still_pending = any(ln.qty_allocated < ln.qty_requested for ln in order.lines)
    if still_pending:
        order.status = "pending_allocation"
    else:
        order.status = "ready_to_ship"
        append_event(
            db,
            "OrderAllocated",
            {"order_id": str(order.id)},
            org_id=order.org_id,
            actor_user_id=actor_user_id,
        )
    return order
