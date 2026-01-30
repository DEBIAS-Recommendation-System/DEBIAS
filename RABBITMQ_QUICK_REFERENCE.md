# RabbitMQ Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Start all services
docker-compose up -d

# Enable RabbitMQ
export USE_RABBITMQ=true

# Start Neo4j worker
cd Ecommerce-API
python run_worker.py --queue neo4j

# Start Qdrant worker
python run_worker.py --queue qdrant

# Send test event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"product_id":100,"event_type":"view","user_session":"test"}'

# Check health
curl http://localhost:8000/rabbitmq/health
```

## 📊 Management URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| RabbitMQ UI | http://localhost:15672 | admin / admin123 |
| FastAPI Docs | http://localhost:8000/docs | - |
| Neo4j Browser | http://localhost:7474 | neo4j / testing_password |

## 🔧 Configuration

### Environment Variables
```bash
# Enable/disable RabbitMQ
USE_RABBITMQ=true          # Use RabbitMQ (async)
USE_RABBITMQ=false         # Direct Neo4j (sync)

# RabbitMQ connection (optional, defaults shown)
RABBITMQ_HOSTNAME=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
```

### Worker Options
```bash
# Queue selection
--queue neo4j              # Process Neo4j events
--queue qdrant             # Process Qdrant events

# Scaling
--workers 3                # Run 3 worker processes
--prefetch 20              # Prefetch 20 messages

# Logging
--log-level DEBUG          # Debug logging
--log-level INFO           # Info logging (default)
```

## 📝 Queue Names

| Queue | Purpose | Max Length | TTL | Consumers |
|-------|---------|------------|-----|-----------|
| events.neo4j | Neo4j interactions | 100,000 | 24h | 1-5 |
| events.qdrant | Qdrant updates | 100,000 | 24h | 1-3 |
| events.dlq | Failed messages | Unlimited | 7d | 0 |

## 🔄 Retry Strategy

| Attempt | Delay | Action |
|---------|-------|--------|
| 1st | Immediate | Process event |
| 2nd | 5 seconds | Retry with counter |
| 3rd | 30 seconds | Retry with counter |
| 4th | 5 minutes | Final retry |
| Failed | - | Move to DLQ |

## 📈 Monitoring

### Key Metrics
- **Queue Depth**: Number of messages waiting
- **Consumer Count**: Number of active workers
- **Message Rate**: Messages per second
- **Error Rate**: Failed messages per minute

### Health Status
```bash
# Check RabbitMQ health
curl http://localhost:8000/rabbitmq/health

# Check specific queue
curl http://localhost:8000/rabbitmq/queues/events.neo4j

# View RabbitMQ logs
docker logs rabbitmq-broker

# View worker logs
tail -f Ecommerce-API/worker.log
```

## 🐛 Troubleshooting

### Workers Not Processing
```bash
# Check if workers running
ps aux | grep run_worker

# Restart workers
pkill -f run_worker
python run_worker.py --queue neo4j
```

### Messages in DLQ
1. Open RabbitMQ UI → Queues → events.dlq
2. Click "Get messages"
3. View message details and error
4. Fix issue in code
5. Purge DLQ or replay messages

### RabbitMQ Connection Failed
```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq

# Check logs
docker logs rabbitmq-broker
```

### Slow Processing
1. Increase worker count: `--workers 3`
2. Increase prefetch: `--prefetch 20`
3. Check Neo4j performance
4. Monitor queue depth

## 📊 Performance

### Expected Throughput
- **Single Worker**: ~1,000 events/sec
- **3 Workers**: ~3,000 events/sec
- **5 Workers**: ~5,000 events/sec

### API Response Time
- **Without RabbitMQ**: 100-500ms (synchronous)
- **With RabbitMQ**: <10ms (asynchronous)

### Processing Latency
- **Queue → Neo4j**: 50-100ms per event
- **End-to-End**: <200ms total

## 🔐 Security

### Production Recommendations
1. Change default credentials
2. Use TLS/SSL for connections
3. Enable authentication
4. Set up firewall rules
5. Use environment variables for secrets

```yaml
# docker-compose.prod.yaml
rabbitmq:
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    RABBITMQ_SSL_CERTFILE: /ssl/cert.pem
    RABBITMQ_SSL_KEYFILE: /ssl/key.pem
```

## 🧪 Testing

### Manual Testing
```bash
# Send single event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"product_id":100,"event_type":"view","user_session":"test"}'

# Send batch events
curl -X POST http://localhost:8000/events/batch \
  -H "Content-Type: application/json" \
  -d '[
    {"user_id":1,"product_id":101,"event_type":"view","user_session":"test"},
    {"user_id":1,"product_id":102,"event_type":"cart","user_session":"test"}
  ]'
```

### Integration Tests
```bash
# Run test suite
cd Ecommerce-API
python tests/test_rabbitmq_integration.py

# Expected output:
# ✅ PASS - RabbitMQ Connection
# ✅ PASS - Publish Single Event
# ✅ PASS - Publish Batch Events
# ✅ PASS - Queue Statistics
# ✅ PASS - Health Endpoint
# 
# Total: 5/5 tests passed
```

## 📚 Documentation Files

| File | Description |
|------|-------------|
| RABBITMQ_ARCHITECTURE.md | Complete architecture and design |
| RABBITMQ_IMPLEMENTATION_GUIDE.md | Step-by-step setup guide |
| RABBITMQ_IMPLEMENTATION_SUMMARY.md | Implementation overview |
| RABBITMQ_DIAGRAMS.md | Visual architecture diagrams |
| RABBITMQ_QUICK_REFERENCE.md | This quick reference |

## 🔗 Useful Links

- [RabbitMQ Docs](https://www.rabbitmq.com/documentation.html)
- [Pika Client](https://pika.readthedocs.io/)
- [RabbitMQ Management](https://www.rabbitmq.com/management.html)
- [Message Patterns](https://www.rabbitmq.com/getstarted.html)

## 📞 Support

For issues:
1. Check worker logs: `tail -f worker.log`
2. Check RabbitMQ UI: http://localhost:15672
3. Run integration tests
4. Review documentation

---

**Pro Tips:**

- Start with 1-2 workers, scale as needed
- Monitor queue depth in RabbitMQ UI
- Use DLQ to track persistent failures
- Enable RabbitMQ gradually (test first)
- Keep worker logs for debugging
- Use health endpoint for monitoring
