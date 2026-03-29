import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Driver, User

router = APIRouter(prefix="/drivers", tags=["drivers"])


class DriverCreate(BaseModel):
    name: str
    phone: str | None = None
    user_id: uuid.UUID | None = None


class DriverOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    phone: str | None
    user_id: uuid.UUID | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[DriverOut])
def list_drivers(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[Driver]:
    return list(db.execute(select(Driver).where(Driver.org_id == current.org_id)).scalars().all())


@router.post("", response_model=DriverOut)
def create_driver(
    body: DriverCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Driver:
    d = Driver(
        org_id=current.org_id,
        name=body.name,
        phone=body.phone,
        user_id=body.user_id,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d
