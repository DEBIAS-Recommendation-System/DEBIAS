# Orchestrator Endpoints - Quick Reference

## Essential Endpoints for Frontend

### 1. **Track Events** (Required for personalization)
```bash
POST /api/v1/events
Body: { user_id, product_id, event_type: "view"|"cart"|"purchase", user_session }
```

### 2. **Get Recommendations** (Main endpoint)
```bash
# Simple GET
GET /api/v1/orchestrator/recommendations/{user_id}?limit=20

# Advanced POST
POST /api/v1/orchestrator/recommendations
Body: { user_id, total_limit, behavioral_weight, trending_weight, activity_weight, mmr_diversity, include_reasons }
```

### 3. **For You Page** (Paginated)
```bash
GET /api/v1/orchestrator/for-you/{user_id}?page=1&page_size=20
```

### 4. **User Mode** (Check current state)
```bash
GET /api/v1/orchestrator/user-mode/{user_id}
```

---

## Frontend Flow

```javascript
// 1. Track product view
await POST('/api/v1/events', { user_id: 1, product_id: 123, event_type: 'view' });

// 2. Get recommendations (automatically adapts to user mode)
const recs = await GET('/api/v1/orchestrator/recommendations/1?limit=20');

// 3. Display based on mode
if (recs.mode === 'post_purchase') {
  showSection('Complete Your Setup', recs.recommendations);
} else if (recs.mode === 'browsing') {
  showSection('Recommended For You', recs.recommendations);
} else {
  showSection('Trending Now', recs.recommendations);
}
```

---

## Mode Transitions

| User Action | Mode | Recommendation Strategy |
|-------------|------|------------------------|
| New user, no history | `cold_start` | Trending/popular items |
| Views 3-5 products | `browsing` | Diverse semantic + behavioral |
| Makes a purchase | `post_purchase` | Complementary products + behavioral |
| 24h after purchase | `browsing` | Back to diverse exploration |

---

## Response Structure

```json
{
  "user_id": 1,
  "mode": "browsing",
  "total_count": 20,
  "sources_used": ["behavioral", "trending", "semantic_similar"],
  "strategy": "Exploring mode: Using semantic search with high diversity...",
  "recommendations": [
    {
      "product_id": 123,
      "score": 0.89,
      "source": "semantic_similar",
      "reason": "Similar to recently viewed item",
      "payload": {
        "title": "Product Name",
        "brand": "Brand",
        "category": "electronics",
        "price": 99.99
      }
    }
  ]
}
```

---

## All Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/events` | POST | Track single event |
| `/events/batch` | POST | Track multiple events |
| `/orchestrator/recommendations` | POST/GET | Main recommendation endpoint |
| `/orchestrator/for-you` | POST/GET | Paginated feed |
| `/orchestrator/user-mode/{user_id}` | GET | Check user mode |
| `/orchestrator/behavioral/{user_id}` | GET | Only behavioral recs |
| `/orchestrator/trending` | GET | Only trending items |
| `/orchestrator/similar-to-recent` | POST | Only semantic similar |
| `/orchestrator/complementary` | POST | Only complementary products |
| `/orchestrator/health` | GET | Service health check |

---

## Event Types

- **view**: User viewed product page
- **cart**: User added to cart
- **purchase**: User completed purchase

---

## Recommendation Sources

- **behavioral**: Collaborative filtering (Neo4j)
- **trending**: Popular items (Neo4j)
- **semantic_similar**: Similar products (Qdrant vectors)
- **complementary**: "Complete your setup" (Neo4j)

---

## Key Parameters

- `mmr_diversity` (0.0-1.0): Higher = more diverse (recommended: 0.7)
- `behavioral_weight` (0.0-1.0): Weight for collaborative filtering (default: 0.3)
- `trending_weight` (0.0-1.0): Weight for trending items (default: 0.2)
- `activity_weight` (0.0-1.0): Weight for recent activity (default: 0.5)
- `lookback_hours`: Hours to check for recent purchase (default: 24)

---

## Implementation Checklist

- [ ] Track views on product page mount
- [ ] Track add-to-cart events
- [ ] Track purchase on checkout success
- [ ] Display recommendations on homepage
- [ ] Display recommendations on product pages
- [ ] Display post-purchase recommendations
- [ ] Handle mode-based UI changes
- [ ] Add loading states
- [ ] Add error fallbacks
- [ ] Cache recommendations (5-10 min)
- [ ] Test mode transitions

---

## Testing Commands

```bash
# Test event tracking
curl -X POST http://localhost:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"product_id":123,"event_type":"view","user_session":"test"}'

# Test recommendations
curl http://localhost:8000/api/v1/orchestrator/recommendations/1?limit=10

# Check user mode
curl http://localhost:8000/api/v1/orchestrator/user-mode/1

# Health check
curl http://localhost:8000/api/v1/orchestrator/health
```
