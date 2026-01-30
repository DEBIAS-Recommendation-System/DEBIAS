"""
RabbitMQ Service for Event Queue Management

This service handles:
1. Connection management to RabbitMQ
2. Queue/Exchange setup and configuration
3. Message publishing (event producers)
4. Message consuming (event consumers)
5. Error handling and retry logic
"""

import json
import logging
from typing import Optional, Dict, Any, Callable
from datetime import datetime
import asyncio

import pika
from pika import BlockingConnection, ConnectionParameters, PlainCredentials
from pika.exceptions import AMQPConnectionError, AMQPChannelError

from app.core.config import settings

logger = logging.getLogger(__name__)


class RabbitMQService:
    """
    Service for managing RabbitMQ connections and message operations.
    Supports both sync and async operations.
    """

    def __init__(
        self,
        host: str = None,
        port: int = None,
        username: str = None,
        password: str = None,
        vhost: str = "/",
    ):
        """
        Initialize RabbitMQ service.

        Args:
            host: RabbitMQ host (default from settings)
            port: RabbitMQ port (default 5672)
            username: RabbitMQ username (default from settings)
            password: RabbitMQ password (default from settings)
            vhost: Virtual host (default "/")
        """
        self.host = host or getattr(settings, "rabbitmq_hostname", "localhost")
        self.port = port or getattr(settings, "rabbitmq_port", 5672)
        self.username = username or getattr(settings, "rabbitmq_user", "admin")
        self.password = password or getattr(settings, "rabbitmq_password", "admin123")
        self.vhost = vhost

        self.connection: Optional[BlockingConnection] = None
        self.channel = None

        # Queue and exchange names
        self.EVENTS_EXCHANGE = "events"
        self.NEO4J_QUEUE = "events.neo4j"
        self.QDRANT_QUEUE = "events.qdrant"
        self.DLQ = "events.dlq"
        self.DLX = "events.dlx"

    def connect(self) -> bool:
        """
        Establish connection to RabbitMQ broker.

        Returns:
            bool: True if connected successfully, False otherwise
        """
        try:
            credentials = PlainCredentials(self.username, self.password)
            parameters = ConnectionParameters(
                host=self.host,
                port=self.port,
                virtual_host=self.vhost,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )

            self.connection = BlockingConnection(parameters)
            self.channel = self.connection.channel()

            logger.info(f"Connected to RabbitMQ at {self.host}:{self.port}")
            return True

        except AMQPConnectionError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to RabbitMQ: {e}")
            return False

    def setup_queues_and_exchanges(self) -> bool:
        """
        Setup exchanges, queues, and bindings for event processing.
        Creates a fanout exchange that broadcasts events to multiple queues.

        Returns:
            bool: True if setup successful, False otherwise
        """
        try:
            if not self.channel:
                logger.error("No channel available. Call connect() first.")
                return False

            # Declare Dead Letter Exchange and Queue
            self.channel.exchange_declare(
                exchange=self.DLX, exchange_type="direct", durable=True
            )

            self.channel.queue_declare(
                queue=self.DLQ,
                durable=True,
                arguments={
                    "x-message-ttl": 604800000,  # 7 days in milliseconds
                },
            )

            self.channel.queue_bind(
                exchange=self.DLX, queue=self.DLQ, routing_key="dlq"
            )

            # Declare main events exchange (fanout)
            self.channel.exchange_declare(
                exchange=self.EVENTS_EXCHANGE, exchange_type="fanout", durable=True
            )

            # Declare Neo4j queue
            self.channel.queue_declare(
                queue=self.NEO4J_QUEUE,
                durable=True,
                arguments={
                    "x-message-ttl": 86400000,  # 24 hours
                    "x-dead-letter-exchange": self.DLX,
                    "x-dead-letter-routing-key": "dlq",
                    "x-max-length": 100000,
                },
            )

            # Bind Neo4j queue to events exchange
            self.channel.queue_bind(
                exchange=self.EVENTS_EXCHANGE, queue=self.NEO4J_QUEUE
            )

            # Declare Qdrant queue
            self.channel.queue_declare(
                queue=self.QDRANT_QUEUE,
                durable=True,
                arguments={
                    "x-message-ttl": 86400000,  # 24 hours
                    "x-dead-letter-exchange": self.DLX,
                    "x-dead-letter-routing-key": "dlq",
                    "x-max-length": 100000,
                },
            )

            # Bind Qdrant queue to events exchange
            self.channel.queue_bind(
                exchange=self.EVENTS_EXCHANGE, queue=self.QDRANT_QUEUE
            )

            logger.info("Successfully setup queues and exchanges")
            return True

        except AMQPChannelError as e:
            logger.error(f"Channel error during setup: {e}")
            return False
        except Exception as e:
            logger.error(f"Error setting up queues and exchanges: {e}")
            return False

    def publish_event(
        self, event_data: Dict[str, Any], exchange: str = None, routing_key: str = ""
    ) -> bool:
        """
        Publish an event to RabbitMQ.

        Args:
            event_data: Event data dictionary
            exchange: Exchange name (default: self.EVENTS_EXCHANGE)
            routing_key: Routing key (not used for fanout exchange)

        Returns:
            bool: True if published successfully, False otherwise
        """
        try:
            if not self.channel:
                if not self.connect():
                    return False

            exchange = exchange or self.EVENTS_EXCHANGE

            # Add metadata
            event_data["published_at"] = datetime.utcnow().isoformat()

            # Serialize to JSON
            message = json.dumps(event_data)

            # Publish with persistence
            self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type="application/json",
                ),
            )

            logger.debug(
                f"Published event to {exchange}: {event_data.get('event_type')}"
            )
            return True

        except Exception as e:
            logger.error(f"Error publishing event: {e}")
            return False

    def publish_batch_events(
        self, events: list[Dict[str, Any]], exchange: str = None, routing_key: str = ""
    ) -> int:
        """
        Publish multiple events in batch.

        Args:
            events: List of event data dictionaries
            exchange: Exchange name (default: self.EVENTS_EXCHANGE)
            routing_key: Routing key (not used for fanout exchange)

        Returns:
            int: Number of successfully published events
        """
        published_count = 0

        for event_data in events:
            if self.publish_event(event_data, exchange, routing_key):
                published_count += 1

        logger.info(f"Published {published_count}/{len(events)} events")
        return published_count

    def consume_messages(
        self,
        queue: str,
        callback: Callable,
        auto_ack: bool = False,
        prefetch_count: int = 10,
    ) -> None:
        """
        Start consuming messages from a queue.
        This is a blocking operation.

        Args:
            queue: Queue name to consume from
            callback: Callback function to process messages
                      Signature: callback(channel, method, properties, body)
            auto_ack: Whether to auto-acknowledge messages
            prefetch_count: Number of messages to prefetch
        """
        try:
            if not self.channel:
                if not self.connect():
                    raise Exception("Failed to connect to RabbitMQ")

            # Set QoS
            self.channel.basic_qos(prefetch_count=prefetch_count)

            # Start consuming
            self.channel.basic_consume(
                queue=queue, on_message_callback=callback, auto_ack=auto_ack
            )

            logger.info(f"Started consuming from queue: {queue}")
            self.channel.start_consuming()

        except KeyboardInterrupt:
            logger.info("Stopped consuming messages (interrupted)")
            self.stop_consuming()
        except Exception as e:
            logger.error(f"Error consuming messages: {e}")
            raise

    def stop_consuming(self) -> None:
        """Stop consuming messages and close connection."""
        try:
            if self.channel:
                self.channel.stop_consuming()
                logger.info("Stopped consuming messages")
        except Exception as e:
            logger.error(f"Error stopping consumer: {e}")
        finally:
            self.close()

    def close(self) -> None:
        """Close RabbitMQ connection."""
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("Closed RabbitMQ connection")
        except Exception as e:
            logger.error(f"Error closing connection: {e}")

    def get_queue_info(self, queue: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a queue.

        Args:
            queue: Queue name

        Returns:
            Dict with queue info (message_count, consumer_count) or None
        """
        try:
            if not self.channel:
                if not self.connect():
                    return None

            queue_state = self.channel.queue_declare(queue=queue, passive=True)

            return {
                "queue": queue,
                "messages": queue_state.method.message_count,
                "consumers": queue_state.method.consumer_count,
            }

        except Exception as e:
            logger.error(f"Error getting queue info for {queue}: {e}")
            return None

    def get_all_queues_info(self) -> Dict[str, Any]:
        """
        Get information about all queues.

        Returns:
            Dict with info for all queues
        """
        queues_info = {}

        for queue in [self.NEO4J_QUEUE, self.QDRANT_QUEUE, self.DLQ]:
            info = self.get_queue_info(queue)
            if info:
                queues_info[queue] = info

        return queues_info

    def health_check(self) -> Dict[str, Any]:
        """
        Check RabbitMQ connection health.

        Returns:
            Dict with health status
        """
        try:
            if not self.connection or self.connection.is_closed:
                if not self.connect():
                    return {
                        "status": "unhealthy",
                        "error": "Cannot connect to RabbitMQ",
                    }

            # Get queue info
            queues = self.get_all_queues_info()

            return {
                "status": "healthy",
                "host": self.host,
                "port": self.port,
                "queues": queues,
            }

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def purge_queue(self, queue: str) -> bool:
        """
        Purge all messages from a queue.
        USE WITH CAUTION - This deletes all messages!

        Args:
            queue: Queue name to purge

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.channel:
                if not self.connect():
                    return False

            self.channel.queue_purge(queue=queue)
            logger.warning(f"Purged queue: {queue}")
            return True

        except Exception as e:
            logger.error(f"Error purging queue {queue}: {e}")
            return False

    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Singleton instance
_rabbitmq_service: Optional[RabbitMQService] = None


def get_rabbitmq_service() -> RabbitMQService:
    """
    Get or create RabbitMQ service singleton.

    Returns:
        RabbitMQService instance
    """
    global _rabbitmq_service

    if _rabbitmq_service is None:
        _rabbitmq_service = RabbitMQService()

        # Connect and setup on first use
        if _rabbitmq_service.connect():
            _rabbitmq_service.setup_queues_and_exchanges()

    return _rabbitmq_service


# For compatibility
rabbitmq_service = get_rabbitmq_service()
