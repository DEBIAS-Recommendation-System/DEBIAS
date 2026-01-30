from datetime import datetime, timezone
from typing import List, Optional
import logging
import os

from fastapi import HTTPException, status

from app.schemas.events import EventCreate
from app.utils.responses import ResponseHandler
from app.core.security import get_current_user
from app.services.neo4j_service import get_neo4j_service
from app.services.rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)

# Feature flag to enable/disable RabbitMQ
USE_RABBITMQ = os.getenv("USE_RABBITMQ", "false").lower() == "true"


class EventService:
    @staticmethod
    def create_event(event: EventCreate, token: Optional[str] = None):
        """
        Stream an event to RabbitMQ (if enabled) or directly to Neo4j.

        Args:
            event: The event data to record
            token: Optional JWT token to extract user_id

        Returns:
            Response with success/failure status
        """
        user_id = event.user_id
        if token is not None:
            user_id = get_current_user(token)

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User ID is required"
            )

        event_time = (event.event_time or datetime.now(timezone.utc)).replace(
            microsecond=0
        )
        event_time_str = event_time.strftime("%Y-%m-%d %H:%M:%S")

        event_data = {
            "event_time": event_time_str,
            "event_type": event.event_type,
            "product_id": event.product_id,
            "user_id": user_id,
            "user_session": event.user_session,
        }

        try:
            if USE_RABBITMQ:
                # Publish to RabbitMQ (async processing)
                rabbitmq_service = get_rabbitmq_service()
                success = rabbitmq_service.publish_event(event_data)

                if success:
                    return ResponseHandler.success(
                        "Event queued for processing", event_data
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to queue event",
                    )
            else:
                # Direct write to Neo4j (synchronous)
                neo4j_service = get_neo4j_service()
                success = neo4j_service.record_interaction(
                    user_id=user_id,
                    product_id=event.product_id,
                    event_type=event.event_type,
                    session_id=event.user_session,
                    event_time=event_time_str,
                )

                if success:
                    return ResponseHandler.success(
                        "Event recorded to Neo4j", event_data
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to record event to Neo4j",
                    )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to process event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process event: {str(e)}",
            )

    @staticmethod
    def create_batch_events(events: List[EventCreate], token: Optional[str] = None):
        """
        Stream multiple events to RabbitMQ (if enabled) or directly to Neo4j.

        Args:
            events: List of events to record
            token: Optional JWT token to extract user_id

        Returns:
            Response with count of recorded events
        """
        default_user_id = None
        if token is not None:
            default_user_id = get_current_user(token)

        interactions = []
        for event in events:
            user_id = event.user_id or default_user_id
            if user_id is None:
                continue

            event_time = (event.event_time or datetime.now(timezone.utc)).replace(
                microsecond=0
            )
            event_time_str = event_time.strftime("%Y-%m-%d %H:%M:%S")

            interactions.append(
                {
                    "user_id": user_id,
                    "product_id": event.product_id,
                    "event_type": event.event_type,
                    "user_session": event.user_session,
                    "event_time": event_time_str,
                }
            )

        if not interactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid events to record",
            )

        try:
            if USE_RABBITMQ:
                # Publish batch to RabbitMQ (async processing)
                rabbitmq_service = get_rabbitmq_service()
                count = rabbitmq_service.publish_batch_events(interactions)

                return ResponseHandler.success(
                    f"Queued {count} events for processing", {"count": count}
                )
            else:
                # Direct batch write to Neo4j (synchronous)
                neo4j_service = get_neo4j_service()
                count = neo4j_service.record_batch_interactions(interactions)

                return ResponseHandler.success(
                    f"Recorded {count} events to Neo4j", {"count": count}
                )

        except Exception as e:
            logger.error(f"Failed to process batch events: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process events: {str(e)}",
            )
