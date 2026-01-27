from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from app.db.database import get_db
from app.schemas.events import EventCreate, EventOut
from app.services.events import EventService

router = APIRouter(tags=["Events"], prefix="/events")
auth_scheme = HTTPBearer(auto_error=False)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=EventOut)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    token: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
):
    return EventService.create_event(db, event, token)
