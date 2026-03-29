import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import SKU, User

router = APIRouter(prefix="/skus", tags=["skus"])


class SKUCreate(BaseModel):
    sku_code: str = Field(min_length=1, max_length=64)
    name: str
    uom: str = "unit"
    weight_kg: float | None = None
    volume_m3: float | None = None


class SKUOut(BaseModel):
    id: uuid.UUID
    sku_code: str
    name: str
    uom: str
    weight_kg: float | None
    volume_m3: float | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[SKUOut])
def list_skus(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[SKU]:
    return list(db.execute(select(SKU).where(SKU.is_active.is_(True))).scalars().all())


@router.post("", response_model=SKUOut)
def create_sku(
    body: SKUCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> SKU:
    sku = SKU(
        sku_code=body.sku_code,
        name=body.name,
        uom=body.uom,
        weight_kg=body.weight_kg,
        volume_m3=body.volume_m3,
    )
    db.add(sku)
    db.commit()
    db.refresh(sku)
    return sku
