import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Order, OrderLine, User
from app.schemas.order import OrderCreate, OrderLineOut, OrderOut
from app.services.allocate import allocate_order
from app.services.events import append_event

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    body: OrderCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Order:
    order = Order(
        org_id=current.org_id,
        retailer_location_id=body.retailer_location_id,
        warehouse_location_id=body.warehouse_location_id,
        status="pending_allocation",
        priority=body.priority,
        requested_window_start=body.requested_window_start,
        requested_window_end=body.requested_window_end,
        notes=body.notes,
        created_by_user_id=current.id,
    )
    db.add(order)
    db.flush()
    for ln in body.lines:
        db.add(
            OrderLine(
                order_id=order.id,
                sku_id=ln.sku_id,
                qty_requested=ln.qty,
                qty_allocated=0,
                status="pending",
            )
        )
    append_event(
        db,
        "OrderCreated",
        {"order_id": str(order.id)},
        org_id=current.org_id,
        actor_user_id=current.id,
    )
    db.commit()
    db.refresh(order)
    order = db.execute(
        select(Order).where(Order.id == order.id).options(joinedload(Order.lines))
    ).scalar_one()
    return OrderOut(
        id=order.id,
        org_id=order.org_id,
        retailer_location_id=order.retailer_location_id,
        warehouse_location_id=order.warehouse_location_id,
        status=order.status,
        priority=order.priority,
        requested_window_start=order.requested_window_start,
        requested_window_end=order.requested_window_end,
        lines=[OrderLineOut.model_validate(x) for x in order.lines],
    )


@router.get("", response_model=list[OrderOut])
def list_orders(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
) -> list[OrderOut]:
    q = select(Order).where(Order.org_id == current.org_id).options(joinedload(Order.lines))
    if status_filter:
        q = q.where(Order.status == status_filter)
    orders = db.execute(q).scalars().unique().all()
    return [
        OrderOut(
            id=o.id,
            org_id=o.org_id,
            retailer_location_id=o.retailer_location_id,
            warehouse_location_id=o.warehouse_location_id,
            status=o.status,
            priority=o.priority,
            requested_window_start=o.requested_window_start,
            requested_window_end=o.requested_window_end,
            lines=[OrderLineOut.model_validate(x) for x in o.lines],
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> OrderOut:
    o = db.execute(
        select(Order)
        .where(Order.id == order_id, Order.org_id == current.org_id)
        .options(joinedload(Order.lines))
    ).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderOut(
        id=o.id,
        org_id=o.org_id,
        retailer_location_id=o.retailer_location_id,
        warehouse_location_id=o.warehouse_location_id,
        status=o.status,
        priority=o.priority,
        requested_window_start=o.requested_window_start,
        requested_window_end=o.requested_window_end,
        lines=[OrderLineOut.model_validate(x) for x in o.lines],
    )


@router.post("/{order_id}/allocate", response_model=OrderOut)
def post_allocate(
    order_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> OrderOut:
    existing = db.get(Order, order_id)
    if not existing or existing.org_id != current.org_id:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        order = allocate_order(db, order_id, actor_user_id=current.id)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    order = db.execute(
        select(Order).where(Order.id == order_id).options(joinedload(Order.lines))
    ).scalar_one()
    return OrderOut(
        id=order.id,
        org_id=order.org_id,
        retailer_location_id=order.retailer_location_id,
        warehouse_location_id=order.warehouse_location_id,
        status=order.status,
        priority=order.priority,
        requested_window_start=order.requested_window_start,
        requested_window_end=order.requested_window_end,
        lines=[OrderLineOut.model_validate(x) for x in order.lines],
    )
