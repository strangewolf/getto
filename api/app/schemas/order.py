import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class OrderLineCreate(BaseModel):
    sku_id: uuid.UUID
    qty: float = Field(gt=0)


class OrderCreate(BaseModel):
    retailer_location_id: uuid.UUID
    warehouse_location_id: uuid.UUID
    lines: list[OrderLineCreate]
    priority: int = 0
    requested_window_start: datetime | None = None
    requested_window_end: datetime | None = None
    notes: str | None = None


class OrderLineOut(BaseModel):
    id: uuid.UUID
    sku_id: uuid.UUID
    qty_requested: float
    qty_allocated: float
    status: str

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    retailer_location_id: uuid.UUID
    warehouse_location_id: uuid.UUID
    status: str
    priority: int
    requested_window_start: datetime | None
    requested_window_end: datetime | None
    lines: list[OrderLineOut]

    model_config = {"from_attributes": True}
