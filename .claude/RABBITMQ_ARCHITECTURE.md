# RabbitMQ Integration Architecture

## Overview

This document describes the RabbitMQ message queue integration between the event ingestion layer and both Qdrant (vector database) and Neo4j (graph database) in the DEBIAS e-commerce recommendation system.

## Architecture Diagram

```
┌─────────────────┐
│                 │
│  Frontend/API   │
│   (FastAPI)     │
│                 │
└────────┬────────┘
         │
         │ POST /events
         │ POST /events/batch
         │
         ▼
┌────────────────────┐
│                    │
│  Event Service     │
│  (event_router)    │
│                    │
└────────┬───────────┘
         │
         │ Publish Event
         │
         ▼
┌────────────────────────────────────────┐
│                                        │
│           RabbitMQ Broker              │
│                                        │
│  Queues:                               │
│  - events.neo4j    (durable)           │
│  - events.qdrant   (durable)           │
│  - events.dlq      (dead letter queue) │
│                                        │
└─────────┬──────────────────────────────┘
          │
          │ Fan-out Exchange
          │
          ├──────────────────┬───────────────────┐
          │                  │                   │
          ▼                  ▼                   ▼
   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
   │             │   │              │   │             │
   │  Neo4j      │   │   Qdrant     │   │    DLQ      │
   │  Worker     │   │   Worker     │   │   Handler   │
   │             │   │              │   │             │
   └──────┬──────┘   └──────┬───────┘   └─────────────┘
          │                  │
          ▼                  ▼
   ┌─────────────┐   ┌──────────────┐
   │             │   │              │
   │   Neo4j     │   │   Qdrant     │
   │  GraphDB    │   │  VectorDB    │
   │             │   │              │
   └─────────────┘   └──────────────┘
```

## Why RabbitMQ?

### Current Architecture Issues
1. **Synchronous Processing**: Events are written directly to Neo4j, blocking API responses
2. **No Fault Tolerance**: If Neo4j is down, events are lost
3. **No Scalability**: Can't scale workers independently
4. **Coupling**: Event service is tightly coupled to Neo4j

### Benefits of RabbitMQ Integration

1. **Asynchronous Processing**
   - API responds immediately after publishing to queue
   - Workers process events in background
   - Improved API response times

2. **Fault Tolerance**
   - Messages persist in queue if workers are down
   - Automatic retry with exponential backoff
   - Dead letter queue for failed messages

3. **Scalability**
   - Multiple workers can consume from same queue
   - Scale Neo4j and Qdrant workers independently
   - Handle traffic spikes without overwhelming databases

4. **Decoupling**
   - Event service only publishes messages
   - Workers handle database operations
   - Easy to add new consumers (e.g., analytics, logging)

5. **Reliability**
   - Message acknowledgment ensures delivery
   - Durable queues survive broker restarts
   - Exactly-once delivery semantics

## Message Flow

### 1. Event Publication (Synchronous)
```python
# User action triggers event
POST /events
{
  "user_id": 123,
  "product_id": 456,
  "event_type": "view",
  "user_session": "session-abc"
}

# FastAPI publishes to RabbitMQ
rabbitmq_service.publish_event(exchange="events", routing_key="user.event", message=event)

# Immediate response
200 OK {"status": "Event queued"}
```

### 2. Event Processing (Asynchronous)

#### Neo4j Worker
```python
# Consumes from events.neo4j queue
message = await queue.get()
event = json.loads(message.body)

# Record interaction in Neo4j
neo4j_service.record_interaction(
    user_id=event["user_id"],
    product_id=event["product_id"],
    event_type=event["event_type"],
    ...
)

# Acknowledge message
await message.ack()
```

#### Qdrant Worker
```python
# Consumes from events.qdrant queue
message = await queue.get()
event = json.loads(message.body)

# Update user interaction history in Qdrant
# (for personalization features)
qdrant_service.update_user_profile(
    user_id=event["user_id"],
    product_id=event["product_id"],
    ...
)

# Acknowledge message
await message.ack()
```

## Queue Configuration

### Exchange
- **Name**: `events`
- **Type**: `fanout` (broadcasts to all bound queues)
- **Durable**: `true`
- **Auto-delete**: `false`

### Queues

#### 1. events.neo4j
- **Purpose**: Store user-product interactions in graph
- **Durable**: `true`
- **Arguments**:
  - `x-message-ttl`: 86400000 (24 hours)
  - `x-dead-letter-exchange`: events.dlx
  - `x-max-length`: 100000

#### 2. events.qdrant
- **Purpose**: Update user profiles and interaction vectors
- **Durable**: `true`
- **Arguments**:
  - `x-message-ttl`: 86400000 (24 hours)
  - `x-dead-letter-exchange`: events.dlx
  - `x-max-length`: 100000

#### 3. events.dlq
- **Purpose**: Store failed messages for analysis
- **Durable**: `true`
- **Arguments**:
  - `x-message-ttl`: 604800000 (7 days)

## Error Handling

### Retry Strategy
1. **First Attempt**: Process immediately
2. **Retry 1**: Wait 5 seconds, requeue with counter
3. **Retry 2**: Wait 30 seconds, requeue with counter
4. **Retry 3**: Wait 5 minutes, requeue with counter
5. **Final Failure**: Move to DLQ for manual inspection

### Dead Letter Queue (DLQ)
- Stores messages that failed after all retries
- Monitored for alerting
- Can be replayed manually after fixing issues
- Useful for debugging and recovery

## Monitoring

### Health Checks
```bash
# Check RabbitMQ status
GET /rabbitmq/health

Response:
{
  "status": "healthy",
  "queues": {
    "events.neo4j": {"messages": 42, "consumers": 2},
    "events.qdrant": {"messages": 15, "consumers": 1},
    "events.dlq": {"messages": 0}
  }
}
```

### Metrics to Monitor
1. **Queue Depth**: Number of unprocessed messages
2. **Consumer Count**: Number of active workers
3. **Message Rate**: Messages per second
4. **Error Rate**: Failed messages per minute
5. **Processing Time**: Average time to process a message

## Deployment

### Docker Compose Setup
```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"    # AMQP port
      - "15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
```

### Worker Deployment
```bash
# Start Neo4j worker
python -m app.workers.event_processor --queue neo4j

# Start Qdrant worker  
python -m app.workers.event_processor --queue qdrant

# Or use the startup script
python run_worker.py
```

## Testing

### Manual Testing
```bash
# 1. Start services
docker-compose up -d

# 2. Post an event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "product_id": 100,
    "event_type": "view",
    "user_session": "test-session"
  }'

# 3. Check RabbitMQ Management UI
# http://localhost:15672
# Username: admin, Password: admin123

# 4. Verify event in Neo4j
# Check graph for new interaction

# 5. Check worker logs
docker logs event-processor-neo4j
```

### Load Testing
```bash
# Send 1000 events
python tests/load_test_rabbitmq.py --events 1000

# Monitor queue depth
watch -n 1 'curl -s http://localhost:15672/api/queues | jq .'
```

## Migration Guide

### Phase 1: Setup (No Code Changes)
1. Add RabbitMQ to docker-compose.yaml
2. Start RabbitMQ container
3. Verify RabbitMQ is healthy

### Phase 2: Add RabbitMQ Service (Backward Compatible)
1. Create rabbitmq_service.py
2. Add configuration to settings
3. Add dependencies to requirements.txt
4. Keep existing event service unchanged

### Phase 3: Parallel Processing
1. Modify event service to publish to both RabbitMQ AND Neo4j
2. Start workers to consume from RabbitMQ
3. Verify both paths work correctly
4. Compare results

### Phase 4: Switch to RabbitMQ Only
1. Remove direct Neo4j writes from event service
2. Events only go through RabbitMQ
3. Monitor for issues
4. Rollback plan: Re-enable direct writes

### Phase 5: Optimization
1. Tune queue parameters
2. Scale workers based on load
3. Implement batch processing
4. Add monitoring and alerting

## Future Enhancements

1. **Priority Queues**: High-priority events (purchases) processed first
2. **Batch Processing**: Process multiple events in one transaction
3. **Stream Processing**: Use RabbitMQ Streams for replay capability
4. **Multi-Region**: Replicate events across regions
5. **Event Sourcing**: Store all events for audit and replay
6. **Real-time Analytics**: Add analytics worker to process events
7. **ML Pipeline**: Feed events to ML models for training

## Performance Considerations

### Expected Throughput
- **Single Worker**: ~1000 events/second
- **Multiple Workers**: Scales linearly (5 workers = ~5000 events/sec)
- **Queue Capacity**: 100,000 messages per queue

### Resource Requirements
- **RabbitMQ**: 512MB RAM minimum, 2GB recommended
- **Worker**: 256MB RAM per worker
- **Network**: <1ms latency to RabbitMQ (same datacenter)

### Optimization Tips
1. Use batch acknowledgments for higher throughput
2. Prefetch count = worker_threads * 2
3. Use persistent connection pools
4. Enable publisher confirms for reliability
5. Monitor memory usage on RabbitMQ

## Troubleshooting

### Issue: Messages piling up in queue
**Solution**: Scale up workers or optimize processing logic

### Issue: Messages going to DLQ
**Solution**: Check worker logs, fix bugs, replay from DLQ

### Issue: Slow message processing
**Solution**: Profile worker code, add indexes to databases, increase worker count

### Issue: RabbitMQ memory alarm
**Solution**: Increase memory limit, reduce message TTL, add more consumers

## References

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Pika (Python Client)](https://pika.readthedocs.io/)
- [aio-pika (Async Python Client)](https://aio-pika.readthedocs.io/)
- [RabbitMQ Management UI](https://www.rabbitmq.com/management.html)
