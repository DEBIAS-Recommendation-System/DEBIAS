from datetime import datetime, timezone
from typing import List, Optional
import logging

from fastapi import HTTPException, status

from app.schemas.events import EventCreate
from app.utils.responses import ResponseHandler
from app.core.security import get_current_user
from app.services.neo4j_service import get_neo4j_service

logger = logging.getLogger(__name__)


class EventService:
    @staticmethod
    def create_event(event: EventCreate, token: Optional[str] = None):
        """
        Stream an event to Neo4j graph database.
        
        Args:
            event: The event data to record
            token: Optional JWT token to extract user_id
            
        Returns:
            Response with success/failure status
        """
        neo4j_service = get_neo4j_service()
        
        user_id = event.user_id
        if token is not None:
            user_id = get_current_user(token)
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )

        event_time = (event.event_time or datetime.now(timezone.utc)).replace(microsecond=0)
        event_time_str = event_time.strftime("%Y-%m-%d %H:%M:%S")

        try:
            success = neo4j_service.record_interaction(
                user_id=user_id,
                product_id=event.product_id,
                event_type=event.event_type,
                session_id=event.user_session,
                event_time=event_time_str
            )
            
            if success:
                event_data = {
                    "event_time": event_time_str,
                    "event_type": event.event_type,
                    "product_id": event.product_id,
                    "user_id": user_id,
                    "user_session": event.user_session
                }
                return ResponseHandler.success("Event recorded to Neo4j", event_data)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to record event to Neo4j"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to stream event to Neo4j: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to record event: {str(e)}"
            )

    @staticmethod
    def create_batch_events(events: List[EventCreate], token: Optional[str] = None):
        """
        Stream multiple events to Neo4j in a single transaction.
        
        Args:
            events: List of events to record
            token: Optional JWT token to extract user_id
            
        Returns:
            Response with count of recorded events
        """
        neo4j_service = get_neo4j_service()
        
        default_user_id = None
        if token is not None:
            default_user_id = get_current_user(token)

        interactions = []
        for event in events:
            user_id = event.user_id or default_user_id
            if user_id is None:
                continue
                
            event_time = (event.event_time or datetime.now(timezone.utc)).replace(microsecond=0)
            event_time_str = event_time.strftime("%Y-%m-%d %H:%M:%S")
            
            interactions.append({
                "user_id": user_id,
                "product_id": event.product_id,
                "event_type": event.event_type,
                "session_id": event.user_session,
                "event_time": event_time_str
            })

        if not interactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid events to record"
            )

        try:
            count = neo4j_service.record_batch_interactions(interactions)
            return ResponseHandler.success(
                f"Recorded {count} events to Neo4j",
                {"count": count}
            )
        except Exception as e:
            logger.error(f"Failed to stream batch events to Neo4j: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to record events: {str(e)}"
            )
