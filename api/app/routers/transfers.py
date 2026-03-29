import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import StockTransfer, StockTransferLine, User
from app.services.stock_transfer import cancel_transfer, create_transfer, receive_transfer, ship_transfer

router = APIRouter(prefix="/transfers", tags=["transfers"])


class TransferLineIn(BaseModel):
    sku_id: uuid.UUID
    qty: float = Field(gt=0)


class TransferCreate(BaseModel):
    from_location_id: uuid.UUID
    to_location_id: uuid.UUID
    lines: list[TransferLineIn]
    notes: str | None = None


class TransferLineOut(BaseModel):
    id: uuid.UUID
    sku_id: uuid.UUID
    qty_requested: float
    qty_shipped: float
    qty_received: float

    model_config = {"from_attributes": True}


class TransferOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    from_location_id: uuid.UUID
    to_location_id: uuid.UUID
    status: str
    notes: str | None
    lines: list[TransferLineOut]


def _to_out(t: StockTransfer) -> TransferOut:
    return TransferOut(
        id=t.id,
        org_id=t.org_id,
        from_location_id=t.from_location_id,
        to_location_id=t.to_location_id,
        status=t.status,
        notes=t.notes,
        lines=[TransferLineOut.model_validate(x) for x in t.lines],
    )


@router.post("", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
def post_transfer(
    body: TransferCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransferOut:
    try:
        t = create_transfer(
            db,
            current.org_id,
            body.from_location_id,
            body.to_location_id,
            [(ln.sku_id, ln.qty) for ln in body.lines],
            body.notes,
            current.id,
        )
        db.commit()
        t = db.execute(
            select(StockTransfer).where(StockTransfer.id == t.id).options(joinedload(StockTransfer.lines))
        ).scalar_one()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _to_out(t)


@router.get("", response_model=list[TransferOut])
def list_transfers(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
) -> list[TransferOut]:
    q = select(StockTransfer).where(StockTransfer.org_id == current.org_id).options(joinedload(StockTransfer.lines))
    if status_filter:
        q = q.where(StockTransfer.status == status_filter)
    rows = db.execute(q).scalars().unique().all()
    return [_to_out(t) for t in rows]


@router.get("/{transfer_id}", response_model=TransferOut)
def get_transfer(
    transfer_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransferOut:
    t = db.execute(
        select(StockTransfer)
        .where(StockTransfer.id == transfer_id, StockTransfer.org_id == current.org_id)
        .options(joinedload(StockTransfer.lines))
    ).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return _to_out(t)


@router.post("/{transfer_id}/ship", response_model=TransferOut)
def post_ship(
    transfer_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransferOut:
    try:
        ship_transfer(db, transfer_id, current.org_id, current.id)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    t = db.execute(
        select(StockTransfer).where(StockTransfer.id == transfer_id).options(joinedload(StockTransfer.lines))
    ).scalar_one()
    return _to_out(t)


@router.post("/{transfer_id}/receive", response_model=TransferOut)
def post_receive(
    transfer_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransferOut:
    try:
        receive_transfer(db, transfer_id, current.org_id, current.id)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    t = db.execute(
        select(StockTransfer).where(StockTransfer.id == transfer_id).options(joinedload(StockTransfer.lines))
    ).scalar_one()
    return _to_out(t)


@router.post("/{transfer_id}/cancel", response_model=TransferOut)
def post_cancel(
    transfer_id: uuid.UUID,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransferOut:
    try:
        cancel_transfer(db, transfer_id, current.org_id, current.id)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    t = db.execute(
        select(StockTransfer).where(StockTransfer.id == transfer_id).options(joinedload(StockTransfer.lines))
    ).scalar_one()
    return _to_out(t)
