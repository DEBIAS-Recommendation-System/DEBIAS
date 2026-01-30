from typing import List
from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from app.schemas.events import EventCreate
from app.services.events import EventService

router = APIRouter(tags=["Events"], prefix="/events")
auth_scheme = HTTPBearer(auto_error=False)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_event(
    event: EventCreate,
    token: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
):
    """Stream a single event to Neo4j graph database."""
    token_str = token.credentials if token else None
    return EventService.create_event(event, token_str)


@router.post("/batch", status_code=status.HTTP_201_CREATED)
def create_batch_events(
    events: List[EventCreate],
    token: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
):
    """Stream multiple events to Neo4j in a single transaction."""
    token_str = token.credentials if token else None
    return EventService.create_batch_events(events, token_str)
