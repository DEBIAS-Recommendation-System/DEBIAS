"""
RabbitMQ Router
Health check and management endpoints for RabbitMQ service.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.services.rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["RabbitMQ"], prefix="/rabbitmq")


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Check RabbitMQ service health and queue status.
    
    Returns queue depths and consumer counts for monitoring.
    """
    try:
        rabbitmq_service = get_rabbitmq_service()
        health_status = rabbitmq_service.health_check()
        
        if health_status["status"] == "healthy":
            return health_status
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=health_status
            )
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"RabbitMQ health check failed: {str(e)}"
        )


@router.get("/queues/{queue_name}", status_code=status.HTTP_200_OK)
async def get_queue_info(queue_name: str):
    """
    Get information about a specific queue.
    
    Args:
        queue_name: Name of the queue (events.neo4j, events.qdrant, or events.dlq)
    """
    try:
        rabbitmq_service = get_rabbitmq_service()
        
        valid_queues = [
            rabbitmq_service.NEO4J_QUEUE,
            rabbitmq_service.QDRANT_QUEUE,
            rabbitmq_service.DLQ
        ]
        
        if queue_name not in valid_queues:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid queue name. Valid queues: {valid_queues}"
            )
        
        info = rabbitmq_service.get_queue_info(queue_name)
        
        if info:
            return info
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Queue not found: {queue_name}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting queue info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get queue info: {str(e)}"
        )


@router.post("/queues/{queue_name}/purge", status_code=status.HTTP_200_OK)
async def purge_queue(queue_name: str):
    """
    Purge all messages from a queue.
    USE WITH CAUTION - This deletes all messages!
    
    Args:
        queue_name: Name of the queue to purge
    """
    try:
        rabbitmq_service = get_rabbitmq_service()
        
        valid_queues = [
            rabbitmq_service.NEO4J_QUEUE,
            rabbitmq_service.QDRANT_QUEUE,
            rabbitmq_service.DLQ
        ]
        
        if queue_name not in valid_queues:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid queue name. Valid queues: {valid_queues}"
            )
        
        success = rabbitmq_service.purge_queue(queue_name)
        
        if success:
            return {
                "status": "success",
                "message": f"Purged queue: {queue_name}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to purge queue: {queue_name}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purging queue: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to purge queue: {str(e)}"
        )
