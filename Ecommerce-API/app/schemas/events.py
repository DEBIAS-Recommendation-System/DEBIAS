from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, field_serializer, field_validator


class BaseConfig:
    from_attributes = True


class EventBase(BaseModel):
    id: int
    event_time: datetime
    event_type: Literal["purchase", "cart", "view"]
    product_id: int
    user_id: Optional[int]
    user_session: str

    @field_validator("event_time", mode="before")
    @classmethod
    def validate_event_time(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            return parsed.replace(tzinfo=timezone.utc)
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.replace(microsecond=0)
        return value

    @field_serializer("event_time")
    def serialize_event_time(self, value: datetime):
        return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    class Config(BaseConfig):
        pass


class EventCreate(BaseModel):
    event_time: Optional[datetime] = None
    event_type: Literal["purchase", "cart", "view"]
    product_id: int
    user_id: Optional[int] = None
    user_session: str

    @field_validator("event_time", mode="before")
    @classmethod
    def validate_event_time(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            return parsed.replace(tzinfo=timezone.utc)
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.replace(microsecond=0)
        return value

    class Config(BaseConfig):
        pass


class EventOut(BaseModel):
    message: str
    data: EventBase

    class Config(BaseConfig):
        pass


class EventsOut(BaseModel):
    message: str
    data: List[EventBase]

    class Config(BaseConfig):
        pass
