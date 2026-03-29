import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Location, User

router = APIRouter(prefix="/locations", tags=["locations"])


class LocationCreate(BaseModel):
    type: str
    name: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None


class LocationOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    type: str
    name: str
    address: str | None
    lat: float | None
    lng: float | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[LocationOut])
def list_locations(
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    type: str | None = Query(None),
) -> list[Location]:
    q = select(Location).where(Location.org_id == current.org_id)
    if type:
        q = q.where(Location.type == type)
    return list(db.execute(q).scalars().all())


@router.post("", response_model=LocationOut)
def create_location(
    body: LocationCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Location:
    loc = Location(
        org_id=current.org_id,
        type=body.type,
        name=body.name,
        address=body.address,
        lat=body.lat,
        lng=body.lng,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc
