#!/usr/bin/env python3
"""
Event Processor Worker Startup Script

This script starts one or more event processor workers that consume
events from RabbitMQ and process them into Neo4j and Qdrant.

Usage:
    # Start single worker
    python run_worker.py --queue neo4j

    # Start multiple workers
    python run_worker.py --queue neo4j --workers 3

    # Start with custom prefetch
    python run_worker.py --queue neo4j --prefetch 20
"""

import sys
import argparse
import logging
import multiprocessing
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.workers.event_processor import Neo4jEventProcessor, QdrantEventProcessor


def setup_logging(log_level: str = "INFO"):
    """
    Setup logging configuration.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
    """
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - [%(processName)s] - %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler("worker.log")],
    )


def start_worker(queue_type: str, prefetch_count: int, worker_id: int = 0):
    """
    Start a worker process.

    Args:
        queue_type: Type of queue to process ('neo4j' or 'qdrant')
        prefetch_count: Number of messages to prefetch
        worker_id: Worker ID for logging
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Starting worker #{worker_id} for queue: {queue_type}")

    try:
        if queue_type == "neo4j":
            worker = Neo4jEventProcessor()
            worker.start(prefetch_count=prefetch_count)
        elif queue_type == "qdrant":
            worker = QdrantEventProcessor()
            worker.start(prefetch_count=prefetch_count)
        else:
            logger.error(f"Unknown queue type: {queue_type}")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info(f"Worker #{worker_id} stopped by user")
    except Exception as e:
        logger.error(f"Worker #{worker_id} error: {e}")
        raise


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Event Processor Worker Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start a single Neo4j worker
  python run_worker.py --queue neo4j
  
  # Start 3 Neo4j workers for parallel processing
  python run_worker.py --queue neo4j --workers 3
  
  # Start Qdrant worker with higher prefetch
  python run_worker.py --queue qdrant --prefetch 20
  
  # Start with debug logging
  python run_worker.py --queue neo4j --log-level DEBUG
        """,
    )

    parser.add_argument(
        "--queue",
        choices=["neo4j", "qdrant"],
        required=True,
        help="Queue to process events from",
    )

    parser.add_argument(
        "--workers", type=int, default=1, help="Number of worker processes (default: 1)"
    )

    parser.add_argument(
        "--prefetch",
        type=int,
        default=10,
        help="Number of messages to prefetch (default: 10)",
    )

    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: INFO)",
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)

    logger.info("=" * 60)
    logger.info("Event Processor Worker Manager")
    logger.info("=" * 60)
    logger.info(f"Queue: {args.queue}")
    logger.info(f"Workers: {args.workers}")
    logger.info(f"Prefetch: {args.prefetch}")
    logger.info(f"Log Level: {args.log_level}")
    logger.info("=" * 60)

    if args.workers == 1:
        # Run single worker in main process
        logger.info("Starting single worker in main process")
        start_worker(args.queue, args.prefetch, 0)
    else:
        # Run multiple workers in separate processes
        logger.info(f"Starting {args.workers} worker processes")

        processes = []

        try:
            for i in range(args.workers):
                process = multiprocessing.Process(
                    target=start_worker,
                    args=(args.queue, args.prefetch, i),
                    name=f"Worker-{i}",
                )
                process.start()
                processes.append(process)
                logger.info(f"Started worker process #{i} (PID: {process.pid})")

            # Wait for all processes
            for process in processes:
                process.join()

        except KeyboardInterrupt:
            logger.info("Shutting down workers...")
            for process in processes:
                process.terminate()
                process.join()
            logger.info("All workers stopped")
        except Exception as e:
            logger.error(f"Error managing workers: {e}")
            for process in processes:
                process.terminate()
                process.join()
            raise


if __name__ == "__main__":
    main()
