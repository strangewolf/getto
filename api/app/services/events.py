import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import BusinessEvent


def append_event(
    db: Session,
    event_type: str,
    payload: dict[str, Any] | None = None,
    org_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
) -> BusinessEvent:
    ev = BusinessEvent(
        event_type=event_type,
        payload=payload or {},
        org_id=org_id,
        actor_user_id=actor_user_id,
    )
    db.add(ev)
    return ev
