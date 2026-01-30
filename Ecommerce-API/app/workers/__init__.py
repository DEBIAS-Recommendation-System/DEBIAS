"""Workers package for background event processing.""""""

Event Processor Workers

This module contains workers that consume events from RabbitMQ queues
and process them into Neo4j and Qdrant databases.

Workers:
1. Neo4jEventProcessor: Processes events for Neo4j graph database
2. QdrantEventProcessor: Processes events for Qdrant vector database
"""

import json
import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime

import pika
from pika.exceptions import AMQPError

from app.services.rabbitmq_service import RabbitMQService, get_rabbitmq_service
from app.services.neo4j_service import get_neo4j_service, Neo4jService
from app.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)


class BaseEventProcessor:
    """
    Base class for event processors.
    Handles common functionality like message parsing and error handling.
    """
    
    def __init__(self, rabbitmq_service: Optional[RabbitMQService] = None):
        """
        Initialize event processor.
        
        Args:
            rabbitmq_service: RabbitMQ service instance (optional)
        """
        self.rabbitmq = rabbitmq_service or get_rabbitmq_service()
        self.retry_delays = [5, 30, 300]  # Retry delays in seconds: 5s, 30s, 5min
    
    def parse_message(self, body: bytes) -> Optional[Dict[str, Any]]:
        """
        Parse message body from JSON.
        
        Args:
            body: Message body bytes
            
        Returns:
            Parsed dict or None if invalid
        """
        try:
            return json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error parsing message: {e}")
            return None
    
    def should_retry(self, message: Dict[str, Any]) -> bool:
        """
        Check if message should be retried.
        
        Args:
            message: Message data
            
        Returns:
            True if should retry, False otherwise
        """
        retry_count = message.get('retry_count', 0)
        return retry_count < len(self.retry_delays)
    
    def requeue_with_delay(
        self,
        channel,
        method,
        message: Dict[str, Any],
        error: str
    ) -> None:
        """
        Requeue message with exponential backoff.
        
        Args:
            channel: RabbitMQ channel
            method: Delivery method
            message: Message data
            error: Error description
        """
        retry_count = message.get('retry_count', 0)
        
        if retry_count < len(self.retry_delays):
            # Increment retry count
            message['retry_count'] = retry_count + 1
            message['last_error'] = error
            message['last_retry_at'] = datetime.utcnow().isoformat()
            
            # Delay before retry
            delay = self.retry_delays[retry_count]
            logger.warning(
                f"Retry {retry_count + 1}/{len(self.retry_delays)} "
                f"after {delay}s for message: {message.get('event_type')}"
            )
            
            time.sleep(delay)
            
            # Requeue message
            channel.basic_publish(
                exchange=self.rabbitmq.EVENTS_EXCHANGE,
                routing_key='',
                body=json.dumps(message),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            
            # Acknowledge original message
            channel.basic_ack(delivery_tag=method.delivery_tag)
        else:
            # Max retries reached, move to DLQ
            logger.error(
                f"Max retries reached for message. Moving to DLQ. "
                f"Error: {error}"
            )
            message['final_error'] = error
            message['failed_at'] = datetime.utcnow().isoformat()
            
            # Reject and don't requeue (will go to DLQ)
            channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
    
    def process_event(self, event: Dict[str, Any]) -> bool:
        """
        Process a single event. Override in subclasses.
        
        Args:
            event: Event data
            
        Returns:
            True if successful, False otherwise
        """
        raise NotImplementedError("Subclasses must implement process_event")
    
    def callback(self, channel, method, properties, body):
        """
        Callback for processing messages from RabbitMQ.
        
        Args:
            channel: RabbitMQ channel
            method: Delivery method
            properties: Message properties
            body: Message body
        """
        message = self.parse_message(body)
        
        if not message:
            # Invalid message, reject it
            logger.error("Invalid message format, rejecting")
            channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
            return
        
        try:
            # Process the event
            success = self.process_event(message)
            
            if success:
                # Acknowledge message
                channel.basic_ack(delivery_tag=method.delivery_tag)
                logger.debug(f"Successfully processed event: {message.get('event_type')}")
            else:
                # Processing failed, retry if possible
                if self.should_retry(message):
                    self.requeue_with_delay(channel, method, message, "Processing failed")
                else:
                    # Max retries reached
                    channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
                    
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            
            # Retry if possible
            if self.should_retry(message):
                self.requeue_with_delay(channel, method, message, str(e))
            else:
                # Max retries reached
                channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
    
    def start(self, queue: str, prefetch_count: int = 10) -> None:
        """
        Start consuming from queue.
        
        Args:
            queue: Queue name to consume from
            prefetch_count: Number of messages to prefetch
        """
        logger.info(f"Starting {self.__class__.__name__} worker for queue: {queue}")
        
        try:
            self.rabbitmq.consume_messages(
                queue=queue,
                callback=self.callback,
                auto_ack=False,
                prefetch_count=prefetch_count
            )
        except KeyboardInterrupt:
            logger.info(f"{self.__class__.__name__} worker stopped by user")
        except Exception as e:
            logger.error(f"Worker error: {e}")
            raise


class Neo4jEventProcessor(BaseEventProcessor):
    """
    Worker that processes events for Neo4j graph database.
    Handles user-product interaction events.
    """
    
    def __init__(
        self,
        rabbitmq_service: Optional[RabbitMQService] = None,
        neo4j_service: Optional[Neo4jService] = None
    ):
        """
        Initialize Neo4j event processor.
        
        Args:
            rabbitmq_service: RabbitMQ service instance
            neo4j_service: Neo4j service instance
        """
        super().__init__(rabbitmq_service)
        self.neo4j = neo4j_service or get_neo4j_service()
    
    def process_event(self, event: Dict[str, Any]) -> bool:
        """
        Process event and record in Neo4j.
        
        Args:
            event: Event data containing user_id, product_id, event_type, etc.
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract event data
            user_id = event.get('user_id')
            product_id = event.get('product_id')
            event_type = event.get('event_type')
            session_id = event.get('user_session', '')
            event_time = event.get('event_time', datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
            
            # Validate required fields
            if not all([user_id, product_id, event_type]):
                logger.error(f"Missing required fields in event: {event}")
                return False
            
            # Record interaction in Neo4j
            success = self.neo4j.record_interaction(
                user_id=user_id,
                product_id=product_id,
                event_type=event_type,
                session_id=session_id,
                event_time=event_time
            )
            
            if success:
                logger.debug(
                    f"Recorded interaction in Neo4j: "
                    f"user={user_id}, product={product_id}, type={event_type}"
                )
                return True
            else:
                logger.warning(f"Failed to record interaction in Neo4j: {event}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing event for Neo4j: {e}")
            return False
    
    def start(self, prefetch_count: int = 10) -> None:
        """
        Start Neo4j event processor.
        
        Args:
            prefetch_count: Number of messages to prefetch
        """
        super().start(queue=self.rabbitmq.NEO4J_QUEUE, prefetch_count=prefetch_count)


class QdrantEventProcessor(BaseEventProcessor):
    """
    Worker that processes events for Qdrant vector database.
    Updates user interaction profiles and embeddings.
    """
    
    def __init__(
        self,
        rabbitmq_service: Optional[RabbitMQService] = None,
        qdrant_service: Optional[QdrantService] = None
    ):
        """
        Initialize Qdrant event processor.
        
        Args:
            rabbitmq_service: RabbitMQ service instance
            qdrant_service: Qdrant service instance
        """
        super().__init__(rabbitmq_service)
        
        if qdrant_service:
            self.qdrant = qdrant_service
        else:
            # Initialize Qdrant service
            from app.services.qdrant_service import qdrant_service
            self.qdrant = qdrant_service
            
            # Ensure connected
            if self.qdrant.client is None:
                self.qdrant.connect()
    
    def process_event(self, event: Dict[str, Any]) -> bool:
        """
        Process event and update Qdrant.
        
        Currently, this is a placeholder for future Qdrant user profile updates.
        Qdrant primarily stores product embeddings, but could be extended to:
        - Store user interaction embeddings
        - Update user preference vectors
        - Track user behavior for personalization
        
        Args:
            event: Event data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract event data
            user_id = event.get('user_id')
            product_id = event.get('product_id')
            event_type = event.get('event_type')
            
            # Validate required fields
            if not all([user_id, product_id, event_type]):
                logger.error(f"Missing required fields in event: {event}")
                return False
            
            # Future implementation ideas:
            # 1. Update user profile collection with interaction history
            # 2. Create user preference embeddings based on interacted products
            # 3. Update product weights based on user interactions
            # 4. Track trending products for recommendations
            
            # For now, just log and acknowledge
            logger.debug(
                f"Processing event for Qdrant: "
                f"user={user_id}, product={product_id}, type={event_type}"
            )
            
            # TODO: Implement actual Qdrant updates when user profile collection is added
            # Example:
            # if event_type == "purchase":
            #     self.qdrant.update_user_profile(user_id, product_id, weight=1.0)
            # elif event_type == "view":
            #     self.qdrant.update_user_profile(user_id, product_id, weight=0.1)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing event for Qdrant: {e}")
            return False
    
    def start(self, prefetch_count: int = 10) -> None:
        """
        Start Qdrant event processor.
        
        Args:
            prefetch_count: Number of messages to prefetch
        """
        super().start(queue=self.rabbitmq.QDRANT_QUEUE, prefetch_count=prefetch_count)


class BatchEventProcessor(BaseEventProcessor):
    """
    Worker that processes events in batches for better performance.
    Accumulates events and writes them in bulk to databases.
    """
    
    def __init__(
        self,
        rabbitmq_service: Optional[RabbitMQService] = None,
        neo4j_service: Optional[Neo4jService] = None,
        batch_size: int = 100,
        flush_interval: int = 10
    ):
        """
        Initialize batch event processor.
        
        Args:
            rabbitmq_service: RabbitMQ service instance
            neo4j_service: Neo4j service instance
            batch_size: Maximum batch size before flushing
            flush_interval: Maximum seconds to wait before flushing
        """
        super().__init__(rabbitmq_service)
        self.neo4j = neo4j_service or get_neo4j_service()
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        
        self.batch: list[Dict[str, Any]] = []
        self.last_flush_time = time.time()
    
    def should_flush(self) -> bool:
        """Check if batch should be flushed."""
        return (
            len(self.batch) >= self.batch_size or
            time.time() - self.last_flush_time >= self.flush_interval
        )
    
    def flush_batch(self) -> bool:
        """
        Flush accumulated events to Neo4j.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.batch:
            return True
        
        try:
            # Prepare interactions for Neo4j
            interactions = []
            for event in self.batch:
                interactions.append({
                    'user_id': event.get('user_id'),
                    'product_id': event.get('product_id'),
                    'event_type': event.get('event_type'),
                    'session_id': event.get('user_session', ''),
                    'event_time': event.get('event_time', datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
                })
            
            # Record batch in Neo4j
            count = self.neo4j.record_batch_interactions(interactions)
            
            logger.info(f"Flushed {count} events to Neo4j")
            
            # Clear batch
            self.batch.clear()
            self.last_flush_time = time.time()
            
            return count == len(interactions)
            
        except Exception as e:
            logger.error(f"Error flushing batch to Neo4j: {e}")
            return False
    
    def process_event(self, event: Dict[str, Any]) -> bool:
        """
        Add event to batch and flush if needed.
        
        Args:
            event: Event data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Validate required fields
            if not all([event.get('user_id'), event.get('product_id'), event.get('event_type')]):
                logger.error(f"Missing required fields in event: {event}")
                return False
            
            # Add to batch
            self.batch.append(event)
            
            # Flush if needed
            if self.should_flush():
                return self.flush_batch()
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing batch event: {e}")
            return False
    
    def start(self, prefetch_count: int = 100) -> None:
        """
        Start batch event processor.
        
        Args:
            prefetch_count: Number of messages to prefetch (higher for batching)
        """
        logger.info("Starting batch event processor")
        
        try:
            super().start(queue=self.rabbitmq.NEO4J_QUEUE, prefetch_count=prefetch_count)
        finally:
            # Flush remaining events on shutdown
            if self.batch:
                logger.info("Flushing remaining events on shutdown")
                self.flush_batch()


def main():
    """Main entry point for event processor workers."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Event Processor Worker")
    parser.add_argument(
        '--queue',
        choices=['neo4j', 'qdrant', 'batch'],
        required=True,
        help='Queue to process (neo4j, qdrant, or batch)'
    )
    parser.add_argument(
        '--prefetch',
        type=int,
        default=10,
        help='Number of messages to prefetch (default: 10)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Batch size for batch processor (default: 100)'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create and start worker
    if args.queue == 'neo4j':
        worker = Neo4jEventProcessor()
        worker.start(prefetch_count=args.prefetch)
    elif args.queue == 'qdrant':
        worker = QdrantEventProcessor()
        worker.start(prefetch_count=args.prefetch)
    elif args.queue == 'batch':
        worker = BatchEventProcessor(batch_size=args.batch_size)
        worker.start(prefetch_count=args.prefetch)


if __name__ == '__main__':
    main()
