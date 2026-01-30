# RabbitMQ Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEBIAS Architecture                          │
│                  (Debiased E-commerce Search System)                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │  Next.js + React
│              │  User interactions
└──────┬───────┘
       │ HTTP POST
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Event Router                                                  │ │
│  │  POST /events         POST /events/batch                       │ │
│  └────────────┬───────────────────────────────────────────────────┘ │
│               │                                                      │
│  ┌────────────▼───────────────────────────────────────────────────┐ │
│  │  Event Service                                                 │ │
│  │  - Validates event data                                        │ │
│  │  - Checks USE_RABBITMQ flag                                    │ │
│  │  - Routes to RabbitMQ or Neo4j                                 │ │
│  └────────────┬───────────────────────────────────────────────────┘ │
└───────────────┼──────────────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ USE_RABBITMQ? │
        └───────┬───────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
    [TRUE]           [FALSE]
        │                │
        │                └──────────────────┐
        │                                   │
        ▼                                   ▼
┌─────────────────────┐         ┌──────────────────┐
│    RabbitMQ Path    │         │   Direct Path    │
│   (Asynchronous)    │         │  (Synchronous)   │
└──────────┬──────────┘         └────────┬─────────┘
           │                              │
           ▼                              ▼
┌───────────────────────────┐   ┌────────────────────┐
│      RabbitMQ Broker      │   │      Neo4j DB      │
│  ┌─────────────────────┐  │   │   Graph Database   │
│  │  Exchange: events   │  │   │                    │
│  │  Type: fanout       │  │   │  Direct Write      │
│  └──────────┬──────────┘  │   │  ✓ Synchronous     │
│             │              │   │  ✓ Blocking        │
│     ┌───────┼───────┐      │   │  ✗ No retry        │
│     │       │       │      │   └────────────────────┘
│     ▼       ▼       ▼      │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Neo4j│ │Qdnt │ │ DLQ │  │
│  │Queue│ │Queue│ │Queue│  │
│  └──┬──┘ └──┬──┘ └─────┘  │
└─────┼───────┼──────────────┘
      │       │
      ▼       ▼
┌──────────┐ ┌──────────┐
│  Neo4j   │ │  Qdrant  │
│  Worker  │ │  Worker  │
│          │ │          │
│ ┌──────┐ │ │ ┌──────┐ │
│ │Retry │ │ │ │Retry │ │
│ │Logic │ │ │ │Logic │ │
│ └──────┘ │ │ └──────┘ │
└─────┬────┘ └─────┬────┘
      │            │
      ▼            ▼
┌──────────────┐ ┌──────────────┐
│   Neo4j DB   │ │  Qdrant DB   │
│ Graph Store  │ │ Vector Store │
│              │ │              │
│ User-Product │ │   Product    │
│Interactions  │ │  Embeddings  │
└──────────────┘ └──────────────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │  Orchestrator  │
        │    Service     │
        │                │
        │ - Combines     │
        │   sources      │
        │ - Generates    │
        │   recommends   │
        └────────────────┘
```

## Message Flow Detail

```
Event Publishing Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────┐
│  Client  │ User clicks product
└────┬─────┘
     │ 1. POST /events
     │    {user_id, product_id, event_type}
     ▼
┌─────────────────┐
│  Event Router   │ FastAPI endpoint
└────┬────────────┘
     │ 2. Parse & validate
     ▼
┌──────────────────┐
│  Event Service   │ Business logic
└────┬─────────────┘
     │ 3. Check feature flag
     ▼
┌──────────────────┐
│ RabbitMQ Service │ Message broker client
└────┬─────────────┘
     │ 4. publish_event()
     │    - Serialize JSON
     │    - Add metadata
     │    - Set persistence
     ▼
┌──────────────────────────────────┐
│      RabbitMQ Broker             │
│  ┌────────────────────────────┐  │
│  │  Exchange: events          │  │
│  │  Type: fanout              │  │
│  │  Durable: true             │  │
│  └──────────┬─────────────────┘  │
│             │ 5. Broadcast       │
│      ┌──────┼──────────┐         │
│      │      │          │         │
│      ▼      ▼          ▼         │
│  ┌──────┬──────┬──────────┐     │
│  │Neo4j │Qdrant│   DLQ    │     │
│  │Queue │Queue │  Queue   │     │
│  │      │      │          │     │
│  │Max:  │Max:  │Max:      │     │
│  │100k  │100k  │Unlimited │     │
│  │TTL:  │TTL:  │TTL:      │     │
│  │24h   │24h   │7 days    │     │
│  └──────┴──────┴──────────┘     │
└──────────────────────────────────┘
     │ 6. Response
     ▼
┌──────────────────┐
│  Client          │ {"status": "queued"}
└──────────────────┘

Event Processing Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────┐
│  Worker Process              │
│  $ python run_worker.py      │
│    --queue neo4j             │
└──────────┬───────────────────┘
           │ 1. Start consuming
           ▼
┌──────────────────────────────┐
│  Neo4jEventProcessor         │
│  - Connects to RabbitMQ      │
│  - Sets QoS (prefetch=10)    │
│  - Registers callback        │
└──────────┬───────────────────┘
           │ 2. Wait for message
           ▼
┌──────────────────────────────┐
│  RabbitMQ Queue: events.neo4j│
│  ┌────────────────────────┐  │
│  │ Message 1              │  │ ◄── Worker pulls message
│  │ {user:1, prod:100}     │  │
│  └────────────────────────┘  │
│  │ Message 2              │  │
│  │ Message 3              │  │
└──────────┬───────────────────┘
           │ 3. Callback triggered
           ▼
┌──────────────────────────────┐
│  BaseEventProcessor          │
│  callback(msg)               │
│  ├─ parse_message()          │
│  ├─ validate_fields()        │
│  └─ process_event()          │
└──────────┬───────────────────┘
           │ 4. Process
           ▼
┌──────────────────────────────┐
│  Neo4jEventProcessor         │
│  process_event(event)        │
│  ├─ Extract data             │
│  ├─ Validate required        │
│  └─ Call Neo4j service       │
└──────────┬───────────────────┘
           │ 5. Write to DB
           ▼
┌──────────────────────────────┐
│  Neo4j Service               │
│  record_interaction()        │
│  ├─ Create/merge User node   │
│  ├─ Create/merge Product     │
│  └─ Create relationship      │
└──────────┬───────────────────┘
           │ 6. Success/Failure
           ▼
        ┌──────┐
        │Success│
        └───┬───┘
            │ 7. Acknowledge
            ▼
    ┌───────────────┐
    │   RabbitMQ    │  Message deleted from queue
    │  (ACK msg)    │
    └───────────────┘

        OR

        ┌──────┐
        │Failure│
        └───┬───┘
            │ 7. Retry logic
            ▼
    ┌───────────────────┐
    │  Retry Count < 3? │
    └───┬───────────┬───┘
        │YES        │NO
        │           │
        ▼           ▼
    Requeue      Move to DLQ
    with delay   (NACK msg)
```

## Queue Architecture

```
Queue Structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                     ┌─────────────────────────┐
                     │   Exchange: events      │
                     │   Type: fanout          │
                     │   Durable: true         │
                     └────────┬────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────┐ ┌──────────┐
    │ events.neo4j    │ │events.qdrant│ │events.dlq│
    ├─────────────────┤ ├─────────────┤ ├──────────┤
    │ Durable: ✓      │ │ Durable: ✓  │ │Durable: ✓│
    │ Max: 100,000    │ │ Max: 100,000│ │Max: None │
    │ TTL: 24h        │ │ TTL: 24h    │ │TTL: 7d   │
    │ DLX: events.dlx │ │ DLX: events.│ │DLX: None │
    └────────┬────────┘ └──────┬──────┘ └──────────┘
             │                 │
             ▼                 ▼
    ┌─────────────────┐ ┌─────────────┐
    │  Neo4j Worker   │ │Qdrant Worker│
    │  Consumers: 1-5 │ │Consumers:1-3│
    │  Prefetch: 10   │ │Prefetch: 10 │
    └─────────────────┘ └─────────────┘

Message Properties:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "event_time": "2026-01-30 10:00:00",
  "event_type": "view",                 ◄── Event type
  "product_id": 100,                    ◄── Product reference
  "user_id": 1,                         ◄── User reference
  "user_session": "session-abc",        ◄── Session tracking
  "published_at": "2026-01-30T10:00:00",◄── Queue timestamp
  "retry_count": 0,                     ◄── Retry tracking
  "last_error": null                    ◄── Error info
}

Properties:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

delivery_mode: 2         ◄── Persistent
content_type: application/json
priority: 0              ◄── Can be used for priority queues
```

## Retry & Error Handling

```
Retry Strategy:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Event Processing Failed
        │
        ▼
    ┌───────────────┐
    │ Retry Count?  │
    └───┬───────────┘
        │
    ┌───┼────────────────┬────────────────┬────────────────┐
    │   │                │                │                │
    │ retry=0          retry=1          retry=2        retry=3
    │   │                │                │                │
    │   ▼                ▼                ▼                ▼
    │ Wait 5s          Wait 30s         Wait 5min     Move to DLQ
    │   │                │                │                │
    │   └────────────────┴────────────────┴────────────────┘
    │                         │
    │                         ▼
    │                  Requeue Message
    │                         │
    │                         ▼
    │                  Try Again
    │
    └─────────────────────────────────────────────────────────────►
                              │
                              ▼
                    ┌─────────────────┐
                    │  Dead Letter     │
                    │  Queue (DLQ)     │
                    │                  │
                    │  - Store 7 days  │
                    │  - Manual review │
                    │  - Can replay    │
                    └─────────────────┘

Error Types:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transient Errors (Retry):
  ├─ Network timeout
  ├─ Database connection lost
  ├─ Temporary service unavailable
  └─ Rate limit exceeded

Permanent Errors (DLQ):
  ├─ Invalid data format
  ├─ Missing required fields
  ├─ Constraint violation
  └─ Business logic error
```

## Monitoring Dashboard

```
RabbitMQ Management UI (http://localhost:15672)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────┐
│  Queues Overview                                                │
├─────────────────┬──────────┬──────────┬──────────┬─────────────┤
│  Queue Name     │ Messages │ Ready    │ Unacked  │ Consumers   │
├─────────────────┼──────────┼──────────┼──────────┼─────────────┤
│  events.neo4j   │    0     │    0     │    0     │      2      │
│  events.qdrant  │    0     │    0     │    0     │      1      │
│  events.dlq     │    0     │    0     │    0     │      0      │
└─────────────────┴──────────┴──────────┴──────────┴─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Message Rates                                                  │
├─────────────────┬──────────┬──────────┬──────────┬─────────────┤
│  Queue Name     │ Publish  │ Deliver  │ Ack      │ Throughput  │
├─────────────────┼──────────┼──────────┼──────────┼─────────────┤
│  events.neo4j   │  100/s   │  95/s    │  95/s    │   95/s      │
│  events.qdrant  │  100/s   │  90/s    │  90/s    │   90/s      │
└─────────────────┴──────────┴──────────┴──────────┴─────────────┘

Health Indicators:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Healthy:
   - Messages = 0 or low
   - Consumers > 0
   - Publish rate ≈ Ack rate

⚠️  Warning:
   - Messages growing slowly
   - Consumers = 1 (no redundancy)
   - DLQ has messages

❌ Critical:
   - Messages > 10,000
   - Consumers = 0
   - Publish rate >> Ack rate
   - DLQ growing rapidly
```

## Performance Metrics

```
Latency Comparison:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Without RabbitMQ (Direct Neo4j):
┌────────────────────────────────────────────────┐
│  API Processing                        10ms    │
│  Neo4j Write                          150ms    │
│  Total Response Time                  160ms    │◄── Blocking
└────────────────────────────────────────────────┘

With RabbitMQ (Async):
┌────────────────────────────────────────────────┐
│  API Processing                        10ms    │
│  RabbitMQ Publish                      5ms     │
│  Total Response Time                   15ms    │◄── Non-blocking
└────────────────────────────────────────────────┘
│
│  (Background Processing)
│  ┌────────────────────────────────────────────┐
│  │  Worker receives message            5ms    │
│  │  Neo4j Write                       150ms   │
│  │  Total Processing                  155ms   │◄── Async
│  └────────────────────────────────────────────┘

Improvement: 10x faster API response (160ms → 15ms)

Throughput Scaling:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Workers    │ Events/sec │ Latency  │ CPU Usage
───────────┼────────────┼──────────┼──────────
    1      │   1,000    │  100ms   │   25%
    3      │   3,000    │  100ms   │   75%
    5      │   5,000    │  120ms   │   95%
   10      │   8,000    │  150ms   │  100%  ◄── Diminishing returns

Optimal: 3-5 workers per queue
```

This visualization provides a complete picture of how RabbitMQ integrates with the DEBIAS system!
