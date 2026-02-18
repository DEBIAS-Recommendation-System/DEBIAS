# RabbitMQ Implementation Guide

## Quick Start

This guide will help you set up and test the RabbitMQ integration for the DEBIAS e-commerce recommendation system.

## Prerequisites

- Docker and Docker Compose installed
- Python 3.9+ installed
- Project dependencies installed

## Installation & Setup

### Step 1: Install Python Dependencies

```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API

# Install RabbitMQ client library
pip install -r requirements.txt
```

### Step 2: Start All Services

```bash
cd /home/adem/Desktop/DEBIAS

# Start all services including RabbitMQ
docker-compose up -d

# Verify all services are running
docker-compose ps
```

Expected output:
```
NAME                STATUS              PORTS
fastapi-app         Up                  0.0.0.0:8000->8000/tcp
fastapi-postgres    Up (healthy)        0.0.0.0:5432->5432/tcp
neo4j-graph-db      Up (healthy)        0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
qdrant-vector-db    Up (healthy)        0.0.0.0:6333-6334->6333-6334/tcp
rabbitmq-broker     Up (healthy)        0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
```

### Step 3: Verify RabbitMQ

1. **Check RabbitMQ Health**
   ```bash
   docker logs rabbitmq-broker
   ```
   
   Look for: `Server startup complete`

2. **Access Management UI**
   - Open browser: http://localhost:15672
   - Login: `admin` / `admin123`
   - Check Queues tab - should see: `events.neo4j`, `events.qdrant`, `events.dlq`

### Step 4: Enable RabbitMQ in API

Set environment variable to enable RabbitMQ:

```bash
# In Ecommerce-API/.env file
USE_RABBITMQ=true
```

Or export it:
```bash
export USE_RABBITMQ=true
```

Restart the API:
```bash
docker-compose restart app
```

### Step 5: Start Event Processor Workers

Open new terminals for each worker:

**Terminal 1 - Neo4j Worker:**
```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API
python run_worker.py --queue neo4j
```

**Terminal 2 - Qdrant Worker (optional):**
```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API
python run_worker.py --queue qdrant
```

You should see:
```
2026-01-30 10:00:00 - __main__ - INFO - ============================================================
2026-01-30 10:00:00 - __main__ - INFO - Event Processor Worker Manager
2026-01-30 10:00:00 - __main__ - INFO - ============================================================
2026-01-30 10:00:00 - __main__ - INFO - Queue: neo4j
2026-01-30 10:00:00 - __main__ - INFO - Workers: 1
2026-01-30 10:00:00 - __main__ - INFO - Prefetch: 10
2026-01-30 10:00:00 - __main__ - INFO - ============================================================
2026-01-30 10:00:00 - app.services.rabbitmq_service - INFO - Connected to RabbitMQ at rabbitmq:5672
2026-01-30 10:00:00 - app.workers.event_processor - INFO - Starting Neo4jEventProcessor worker for queue: events.neo4j
```

## Testing the Integration

### Test 1: Post a Single Event

```bash
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "product_id": 100,
    "event_type": "view",
    "user_session": "test-session-123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Event queued for processing",
  "data": {
    "event_time": "2026-01-30 10:00:00",
    "event_type": "view",
    "product_id": 100,
    "user_id": 1,
    "user_session": "test-session-123"
  }
}
```

**Verify:**
1. Check worker logs - should see event processing
2. Check RabbitMQ UI - message count should increase then decrease
3. Check Neo4j - verify interaction was recorded

### Test 2: Post Batch Events

```bash
curl -X POST http://localhost:8000/events/batch \
  -H "Content-Type: application/json" \
  -d '[
    {
      "user_id": 1,
      "product_id": 101,
      "event_type": "view",
      "user_session": "test-session-123"
    },
    {
      "user_id": 1,
      "product_id": 102,
      "event_type": "cart",
      "user_session": "test-session-123"
    },
    {
      "user_id": 1,
      "product_id": 103,
      "event_type": "purchase",
      "user_session": "test-session-123"
    }
  ]'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Queued 3 events for processing",
  "data": {
    "count": 3
  }
}
```

### Test 3: Load Testing

Create a load test script:

```python
# test_load.py
import requests
import random
import time
from concurrent.futures import ThreadPoolExecutor

def send_event(event_id):
    """Send a single event"""
    event = {
        "user_id": random.randint(1, 100),
        "product_id": random.randint(1, 1000),
        "event_type": random.choice(["view", "cart", "purchase"]),
        "user_session": f"session-{event_id}"
    }
    
    response = requests.post(
        "http://localhost:8000/events",
        json=event
    )
    
    return response.status_code == 200

def load_test(num_events=1000, workers=10):
    """Run load test"""
    print(f"Sending {num_events} events with {workers} workers...")
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(send_event, range(num_events)))
    
    duration = time.time() - start_time
    success_count = sum(results)
    
    print(f"Completed in {duration:.2f} seconds")
    print(f"Success: {success_count}/{num_events}")
    print(f"Throughput: {num_events/duration:.2f} events/sec")

if __name__ == '__main__':
    load_test(num_events=1000, workers=10)
```

Run it:
```bash
python test_load.py
```

Monitor RabbitMQ UI during the test to see message flow.

### Test 4: Verify Data in Neo4j

```bash
# Connect to Neo4j browser
# http://localhost:7474
# Username: neo4j, Password: testing_password

# Run query
MATCH (u:User {user_id: 1})-[r:INTERACTED]->(p:Product)
RETURN u, r, p
LIMIT 25
```

## Monitoring

### RabbitMQ Management UI

Access: http://localhost:15672 (admin / admin123)

**Key Metrics to Monitor:**
1. **Queue Depth**: Number of messages waiting to be processed
2. **Message Rate**: Incoming/outgoing messages per second
3. **Consumer Count**: Number of active workers
4. **Message Details**: Click on queue to see message details

### Worker Logs

Workers log to both console and `worker.log` file:

```bash
# Watch worker logs
tail -f Ecommerce-API/worker.log

# Filter for errors
grep ERROR Ecommerce-API/worker.log
```

### Health Check Endpoint

Check RabbitMQ health from API:

```bash
# Create this endpoint in app/routers/health.py
curl http://localhost:8000/health/rabbitmq
```

Expected response:
```json
{
  "status": "healthy",
  "host": "rabbitmq",
  "port": 5672,
  "queues": {
    "events.neo4j": {
      "queue": "events.neo4j",
      "messages": 0,
      "consumers": 1
    },
    "events.qdrant": {
      "queue": "events.qdrant",
      "messages": 0,
      "consumers": 1
    },
    "events.dlq": {
      "queue": "events.dlq",
      "messages": 0,
      "consumers": 0
    }
  }
}
```

## Scaling Workers

### Run Multiple Workers for Same Queue

**Option 1: Multiple Processes**
```bash
python run_worker.py --queue neo4j --workers 3
```

**Option 2: Separate Terminals**
```bash
# Terminal 1
python run_worker.py --queue neo4j

# Terminal 2
python run_worker.py --queue neo4j

# Terminal 3
python run_worker.py --queue neo4j
```

RabbitMQ will automatically load balance messages across all workers.

### Optimal Worker Count

- Start with 1-2 workers per queue
- Monitor queue depth in RabbitMQ UI
- If queue depth keeps growing, add more workers
- Optimal: Number of CPU cores available

## Troubleshooting

### Issue 1: Workers Not Processing Messages

**Check:**
1. Workers are running: `ps aux | grep run_worker`
2. RabbitMQ is healthy: `docker logs rabbitmq-broker`
3. Workers connected: Check RabbitMQ UI → Queues → events.neo4j → Consumers

**Solution:**
```bash
# Restart workers
pkill -f run_worker
python run_worker.py --queue neo4j

# Check worker logs for errors
tail -f worker.log
```

### Issue 2: Messages Going to Dead Letter Queue

**Check DLQ:**
- RabbitMQ UI → Queues → events.dlq
- Get message details to see error

**Solution:**
1. Fix the issue in code
2. Replay messages from DLQ:
   ```python
   # replay_dlq.py
   from app.services.rabbitmq_service import get_rabbitmq_service
   
   rabbitmq = get_rabbitmq_service()
   # TODO: Implement message replay from DLQ
   ```

### Issue 3: RabbitMQ Connection Failed

**Check:**
```bash
# Is RabbitMQ running?
docker ps | grep rabbitmq

# Check logs
docker logs rabbitmq-broker

# Test connection
docker exec rabbitmq-broker rabbitmqctl status
```

**Solution:**
```bash
# Restart RabbitMQ
docker-compose restart rabbitmq

# Wait for healthy status
docker-compose ps rabbitmq
```

### Issue 4: Slow Message Processing

**Diagnose:**
1. Check Neo4j query performance
2. Check worker CPU/memory usage
3. Monitor queue depth trend

**Solutions:**
1. Increase worker count
2. Increase prefetch count: `--prefetch 20`
3. Optimize Neo4j queries
4. Add database indexes

### Issue 5: API Responds But Events Not Queued

**Check:**
```bash
# Is USE_RABBITMQ enabled?
echo $USE_RABBITMQ

# Check API logs
docker logs fastapi-app | grep -i rabbitmq
```

**Solution:**
```bash
# Enable RabbitMQ
export USE_RABBITMQ=true

# Or in .env file
echo "USE_RABBITMQ=true" >> Ecommerce-API/.env

# Restart API
docker-compose restart app
```

## Performance Tuning

### RabbitMQ Configuration

Edit docker-compose.yaml:
```yaml
rabbitmq:
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
    RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.8  # Use 80% of available memory
    RABBITMQ_DISK_FREE_LIMIT: 2GB           # Minimum free disk space
```

### Worker Configuration

**For High Throughput:**
```bash
# More workers, higher prefetch
python run_worker.py --queue neo4j --workers 5 --prefetch 50
```

**For Low Latency:**
```bash
# Fewer workers, lower prefetch
python run_worker.py --queue neo4j --workers 2 --prefetch 5
```

### Queue Configuration

Adjust in `app/services/rabbitmq_service.py`:
```python
self.channel.queue_declare(
    queue=self.NEO4J_QUEUE,
    durable=True,
    arguments={
        'x-message-ttl': 86400000,      # Increase if needed
        'x-max-length': 100000,          # Increase for more buffering
        'x-max-priority': 10             # Enable priority queues
    }
)
```

## Migration from Direct Neo4j Writes

### Phase 1: Enable RabbitMQ (Parallel Mode)

Keep both direct writes AND RabbitMQ publishing:

```python
# In events.py
success1 = neo4j_service.record_interaction(...)
success2 = rabbitmq_service.publish_event(...)
```

### Phase 2: Monitor Both Paths

Compare results:
- Check Neo4j for both direct and worker-written events
- Verify no data loss
- Compare performance

### Phase 3: Switch to RabbitMQ Only

Set `USE_RABBITMQ=true` and remove direct writes.

### Rollback Plan

If issues occur:
```bash
# Disable RabbitMQ immediately
export USE_RABBITMQ=false
docker-compose restart app

# Events will go directly to Neo4j
```

## Production Deployment

### Docker Compose for Production

```yaml
# docker-compose.prod.yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

  worker-neo4j:
    build: ./Ecommerce-API
    command: ["python", "run_worker.py", "--queue", "neo4j", "--workers", "3"]
    depends_on:
      - rabbitmq
      - neo4j
    restart: unless-stopped

  worker-qdrant:
    build: ./Ecommerce-API
    command: ["python", "run_worker.py", "--queue", "qdrant", "--workers", "2"]
    depends_on:
      - rabbitmq
      - qdrant
    restart: unless-stopped
```

### Monitoring & Alerting

Set up alerts for:
1. Queue depth > 10,000 messages
2. No consumers on queue
3. High error rate in DLQ
4. Worker process crashes
5. RabbitMQ memory/disk limits

### Backup & Recovery

```bash
# Backup RabbitMQ definitions
docker exec rabbitmq-broker rabbitmqctl export_definitions /tmp/definitions.json
docker cp rabbitmq-broker:/tmp/definitions.json ./backup/

# Restore
docker cp ./backup/definitions.json rabbitmq-broker:/tmp/
docker exec rabbitmq-broker rabbitmqctl import_definitions /tmp/definitions.json
```

## Additional Resources

- [RabbitMQ Architecture Documentation](../RABBITMQ_ARCHITECTURE.md)
- [RabbitMQ Official Docs](https://www.rabbitmq.com/documentation.html)
- [Pika Documentation](https://pika.readthedocs.io/)
- [RabbitMQ Management UI](https://www.rabbitmq.com/management.html)

## Support

For issues or questions:
1. Check worker logs: `tail -f worker.log`
2. Check RabbitMQ logs: `docker logs rabbitmq-broker`
3. Check RabbitMQ UI: http://localhost:15672
4. Review architecture docs: `RABBITMQ_ARCHITECTURE.md`
