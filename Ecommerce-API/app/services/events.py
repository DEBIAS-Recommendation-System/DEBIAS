from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.models import Event, Product
from app.schemas.events import EventCreate
from app.utils.responses import ResponseHandler
from app.core.security import get_current_user


class EventService:
    @staticmethod
    def create_event(db: Session, event: EventCreate, token=None):
        product = db.query(Product).filter(Product.product_id == event.product_id).first()
        if not product:
            ResponseHandler.not_found_error("Product", event.product_id)

        user_id = event.user_id
        if token is not None:
            user_id = get_current_user(token)

        event_time = (event.event_time or datetime.now(timezone.utc)).replace(microsecond=0)

        db_event = Event(
            event_time=event_time,
            event_type=event.event_type,
            product_id=event.product_id,
            user_id=user_id,
            user_session=event.user_session,
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return ResponseHandler.create_success("Event", db_event.id, db_event)
