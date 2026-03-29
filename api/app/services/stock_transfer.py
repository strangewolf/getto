import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import InventoryBalance, Location, SKU, StockTransfer, StockTransferLine
from app.services.events import append_event


def _require_warehouses(db: Session, org_id: uuid.UUID, from_id: uuid.UUID, to_id: uuid.UUID) -> tuple[Location, Location]:
    if from_id == to_id:
        raise ValueError("Source and destination must differ")
    a = db.get(Location, from_id)
    b = db.get(Location, to_id)
    if not a or not b or a.org_id != org_id or b.org_id != org_id:
        raise ValueError("Locations not found or org mismatch")
    if a.type != "warehouse" or b.type != "warehouse":
        raise ValueError("Both endpoints must be warehouse locations")
    return a, b


def create_transfer(
    db: Session,
    org_id: uuid.UUID,
    from_location_id: uuid.UUID,
    to_location_id: uuid.UUID,
    lines: list[tuple[uuid.UUID, float]],
    notes: str | None,
    created_by_user_id: uuid.UUID | None,
) -> StockTransfer:
    _require_warehouses(db, org_id, from_location_id, to_location_id)
    seen: set[uuid.UUID] = set()
    for sku_id, qty in lines:
        if sku_id in seen:
            raise ValueError("Duplicate SKU in transfer lines")
        seen.add(sku_id)
        if qty <= 0:
            raise ValueError("Quantities must be positive")
        if not db.get(SKU, sku_id):
            raise ValueError(f"SKU {sku_id} not found")

    t = StockTransfer(
        org_id=org_id,
        from_location_id=from_location_id,
        to_location_id=to_location_id,
        status="draft",
        notes=notes,
        created_by_user_id=created_by_user_id,
    )
    db.add(t)
    db.flush()
    for sku_id, qty in lines:
        db.add(
            StockTransferLine(
                transfer_id=t.id,
                sku_id=sku_id,
                qty_requested=qty,
                qty_shipped=0,
                qty_received=0,
            )
        )
    append_event(
        db,
        "TransferCreated",
        {"transfer_id": str(t.id), "from": str(from_location_id), "to": str(to_location_id)},
        org_id=org_id,
        actor_user_id=created_by_user_id,
    )
    return t


def ship_transfer(
    db: Session,
    transfer_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_user_id: uuid.UUID | None,
) -> StockTransfer:
    t = db.execute(
        select(StockTransfer)
        .where(StockTransfer.id == transfer_id, StockTransfer.org_id == org_id)
        .options(joinedload(StockTransfer.lines))
    ).scalar_one_or_none()
    if not t:
        raise ValueError("Transfer not found")
    if t.status != "draft":
        raise ValueError("Only draft transfers can be shipped")
    if not t.lines:
        raise ValueError("Transfer has no lines")

    for line in t.lines:
        inv = db.execute(
            select(InventoryBalance).where(
                InventoryBalance.location_id == t.from_location_id,
                InventoryBalance.sku_id == line.sku_id,
            ).with_for_update()
        ).scalar_one_or_none()
        if not inv:
            raise ValueError(f"No inventory row for SKU at source warehouse (line {line.id})")
        available = inv.on_hand - inv.reserved
        need = line.qty_requested
        if available < need:
            raise ValueError(f"Insufficient stock for SKU {line.sku_id}: need {need}, available {available}")
        inv.on_hand -= need
        line.qty_shipped = need

    t.status = "in_transit"
    append_event(
        db,
        "TransferShipped",
        {"transfer_id": str(t.id)},
        org_id=org_id,
        actor_user_id=actor_user_id,
    )
    return t


def receive_transfer(
    db: Session,
    transfer_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_user_id: uuid.UUID | None,
) -> StockTransfer:
    t = db.execute(
        select(StockTransfer)
        .where(StockTransfer.id == transfer_id, StockTransfer.org_id == org_id)
        .options(joinedload(StockTransfer.lines))
    ).scalar_one_or_none()
    if not t:
        raise ValueError("Transfer not found")
    if t.status != "in_transit":
        raise ValueError("Only in_transit transfers can be received")

    for line in t.lines:
        qty = line.qty_shipped
        if qty <= 0:
            continue
        inv = db.execute(
            select(InventoryBalance).where(
                InventoryBalance.location_id == t.to_location_id,
                InventoryBalance.sku_id == line.sku_id,
            ).with_for_update()
        ).scalar_one_or_none()
        if not inv:
            inv = InventoryBalance(
                location_id=t.to_location_id,
                sku_id=line.sku_id,
                on_hand=0,
                reserved=0,
            )
            db.add(inv)
            db.flush()
        inv.on_hand += qty
        line.qty_received = qty

    t.status = "received"
    append_event(
        db,
        "TransferReceived",
        {"transfer_id": str(t.id)},
        org_id=org_id,
        actor_user_id=actor_user_id,
    )
    return t


def cancel_transfer(
    db: Session,
    transfer_id: uuid.UUID,
    org_id: uuid.UUID,
    actor_user_id: uuid.UUID | None,
) -> StockTransfer:
    t = db.get(StockTransfer, transfer_id)
    if not t or t.org_id != org_id:
        raise ValueError("Transfer not found")
    if t.status not in ("draft",):
        raise ValueError("Only draft transfers can be cancelled")
    t.status = "cancelled"
    append_event(
        db,
        "TransferCancelled",
        {"transfer_id": str(t.id)},
        org_id=org_id,
        actor_user_id=actor_user_id,
    )
    return t
