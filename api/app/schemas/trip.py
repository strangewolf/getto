import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PlanTripRequest(BaseModel):
    warehouse_location_id: uuid.UUID
    order_ids: list[uuid.UUID]
    vehicle_id: uuid.UUID | None = None
    driver_id: uuid.UUID | None = None
    planned_start: datetime | None = None


class StopDeliveryOut(BaseModel):
    id: uuid.UUID
    order_line_id: uuid.UUID
    qty_planned: float
    qty_delivered: float
    status: str
    reason_code: str | None

    model_config = {"from_attributes": True}


class TripStopOut(BaseModel):
    id: uuid.UUID
    sequence: int
    location_id: uuid.UUID
    status: str
    eta: datetime | None
    arrived_at: datetime | None
    deliveries: list[StopDeliveryOut]

    model_config = {"from_attributes": True}


class TripSummary(BaseModel):
    id: uuid.UUID
    status: str
    warehouse_location_id: uuid.UUID
    vehicle_id: uuid.UUID | None
    driver_id: uuid.UUID | None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TripOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    warehouse_location_id: uuid.UUID
    status: str
    vehicle_id: uuid.UUID | None
    driver_id: uuid.UUID | None
    planned_start: datetime | None
    dispatched_at: datetime | None
    completed_at: datetime | None
    created_at: datetime | None = None
    stops: list[TripStopOut]

    model_config = {"from_attributes": True}


class DeliverLine(BaseModel):
    stop_delivery_id: uuid.UUID
    qty_delivered: float = Field(ge=0)
    status: str = "delivered"
    reason_code: str | None = None
    signature_url: str | None = None
    photo_url: str | None = None


class DeliverBody(BaseModel):
    deliveries: list[DeliverLine]
