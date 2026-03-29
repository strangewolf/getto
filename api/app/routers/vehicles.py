import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, Vehicle

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


class VehicleCreate(BaseModel):
    reg_number: str = Field(min_length=1, max_length=32)
    capacity_kg: float | None = None
    capacity_m3: float | None = None


class VehicleOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    reg_number: str
    capacity_kg: float | None
    capacity_m3: float | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[Vehicle]:
    return list(db.execute(select(Vehicle).where(Vehicle.org_id == current.org_id)).scalars().all())


@router.post("", response_model=VehicleOut)
def create_vehicle(
    body: VehicleCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Vehicle:
    v = Vehicle(
        org_id=current.org_id,
        reg_number=body.reg_number,
        capacity_kg=body.capacity_kg,
        capacity_m3=body.capacity_m3,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
