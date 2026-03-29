import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import InventoryBalance, Location, SKU, User

router = APIRouter(prefix="/inventory", tags=["inventory"])


class InventoryRow(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    location_name: str
    sku_id: uuid.UUID
    sku_code: str
    on_hand: float
    reserved: float
    available: float


@router.get("", response_model=list[InventoryRow])
def list_inventory(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    location_id: uuid.UUID | None = Query(None),
) -> list[InventoryRow]:
    q = (
        select(InventoryBalance, Location.name, SKU.sku_code)
        .join(Location, Location.id == InventoryBalance.location_id)
        .join(SKU, SKU.id == InventoryBalance.sku_id)
        .where(Location.org_id == current.org_id)
    )
    if location_id:
        q = q.where(InventoryBalance.location_id == location_id)
    rows = db.execute(q).all()
    out: list[InventoryRow] = []
    for inv, loc_name, sku_code in rows:
        avail = inv.on_hand - inv.reserved
        out.append(
            InventoryRow(
                id=inv.id,
                location_id=inv.location_id,
                location_name=loc_name,
                sku_id=inv.sku_id,
                sku_code=sku_code,
                on_hand=inv.on_hand,
                reserved=inv.reserved,
                available=avail,
            )
        )
    return out
