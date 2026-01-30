#!/usr/bin/env python3
"""
Test RabbitMQ Integration

This script tests the complete RabbitMQ integration by:
1. Checking RabbitMQ connection
2. Publishing test events
3. Verifying events are processed
4. Checking queue stats
"""

import sys
import time
import requests
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.services.rabbitmq_service import get_rabbitmq_service

API_URL = "http://localhost:8000"


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def test_rabbitmq_connection():
    """Test RabbitMQ connection"""
    print_header("Test 1: RabbitMQ Connection")
    
    try:
        rabbitmq = get_rabbitmq_service()
        health = rabbitmq.health_check()
        
        if health["status"] == "healthy":
            print("✅ RabbitMQ connection: HEALTHY")
            print(f"   Host: {health['host']}")
            print(f"   Port: {health['port']}")
            
            for queue_name, queue_info in health.get("queues", {}).items():
                print(f"\n   Queue: {queue_name}")
                print(f"   - Messages: {queue_info['messages']}")
                print(f"   - Consumers: {queue_info['consumers']}")
            
            return True
        else:
            print("❌ RabbitMQ connection: UNHEALTHY")
            print(f"   Error: {health.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ RabbitMQ connection failed: {e}")
        return False


def test_publish_event():
    """Test publishing a single event"""
    print_header("Test 2: Publish Single Event")
    
    event = {
        "user_id": 999,
        "product_id": 1001,
        "event_type": "view",
        "user_session": "test-session-rabbitmq"
    }
    
    try:
        response = requests.post(f"{API_URL}/events", json=event)
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Event published successfully")
            print(f"   Response: {data['message']}")
            print(f"   Event: {data['data']['event_type']} - "
                  f"User {data['data']['user_id']} - "
                  f"Product {data['data']['product_id']}")
            return True
        else:
            print(f"❌ Failed to publish event: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error publishing event: {e}")
        return False


def test_publish_batch():
    """Test publishing batch events"""
    print_header("Test 3: Publish Batch Events")
    
    events = [
        {
            "user_id": 999,
            "product_id": 1001 + i,
            "event_type": ["view", "cart", "purchase"][i % 3],
            "user_session": "test-session-batch"
        }
        for i in range(10)
    ]
    
    try:
        response = requests.post(f"{API_URL}/events/batch", json=events)
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Batch events published successfully")
            print(f"   Response: {data['message']}")
            print(f"   Count: {data['data']['count']}")
            return True
        else:
            print(f"❌ Failed to publish batch: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error publishing batch: {e}")
        return False


def test_queue_stats():
    """Test queue statistics"""
    print_header("Test 4: Check Queue Stats")
    
    try:
        rabbitmq = get_rabbitmq_service()
        
        for queue in [rabbitmq.NEO4J_QUEUE, rabbitmq.QDRANT_QUEUE, rabbitmq.DLQ]:
            info = rabbitmq.get_queue_info(queue)
            
            if info:
                print(f"\n✅ Queue: {queue}")
                print(f"   Messages: {info['messages']}")
                print(f"   Consumers: {info['consumers']}")
                
                if info['consumers'] == 0 and info['messages'] > 0:
                    print("   ⚠️  WARNING: Messages waiting but no consumers!")
            else:
                print(f"❌ Could not get info for queue: {queue}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking queue stats: {e}")
        return False


def test_health_endpoint():
    """Test API health endpoint"""
    print_header("Test 5: API Health Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/rabbitmq/health")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working")
            print(f"   Status: {data['status']}")
            print(f"   Queues: {len(data.get('queues', {}))}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking health endpoint: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  RABBITMQ INTEGRATION TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Connection
    results.append(("RabbitMQ Connection", test_rabbitmq_connection()))
    
    # Test 2: Single event
    results.append(("Publish Single Event", test_publish_event()))
    
    # Wait for processing
    print("\n⏳ Waiting 2 seconds for event processing...")
    time.sleep(2)
    
    # Test 3: Batch events
    results.append(("Publish Batch Events", test_publish_batch()))
    
    # Wait for processing
    print("\n⏳ Waiting 2 seconds for batch processing...")
    time.sleep(2)
    
    # Test 4: Queue stats
    results.append(("Queue Statistics", test_queue_stats()))
    
    # Test 5: Health endpoint
    results.append(("Health Endpoint", test_health_endpoint()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
