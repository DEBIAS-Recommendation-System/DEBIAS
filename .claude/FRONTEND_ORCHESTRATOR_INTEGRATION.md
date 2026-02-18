# Frontend Integration Guide: Orchestrator Recommendation System

## Overview

The orchestrator provides intelligent, multi-source recommendations that automatically adapt based on user behavior. This guide shows you exactly which endpoints to call to replicate the demo scenario.

## Key Concepts

### User Modes
The system automatically switches between three modes:
- **COLD_START**: New user, no history → Shows trending/popular items
- **BROWSING**: User exploring products → Diverse semantic recommendations + behavioral
- **POST_PURCHASE**: User just bought something → Complementary products + behavioral

### Recommendation Sources
- **behavioral**: "Users like you also liked..." (Neo4j collaborative filtering)
- **trending**: Popular/bestselling items (Neo4j)
- **semantic_similar**: Products similar to recent views (Qdrant vector search with MMR diversity)
- **complementary**: "Complete your setup" - items bought after this product (Neo4j)

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

---

## 1. Record User Events (REQUIRED for orchestrator to work)

Events must be sent to Neo4j for the orchestrator to determine user mode and provide personalized recommendations.

### Record Single Event
```http
POST /events
Content-Type: application/json

{
  "user_id": 1,
  "product_id": 123,
  "event_type": "view",  // "view", "cart", or "purchase"
  "user_session": "session_abc123",
  "event_time": "2026-01-30T10:30:00Z"  // optional
}
```

**When to call:**
- Product page viewed: `event_type: "view"`
- Add to cart: `event_type: "cart"`
- Purchase completed: `event_type: "purchase"`

**Alternative endpoint:**
```http
POST /behavioral/interactions
```
(Same request body, different route - both go to Neo4j)

### Record Batch Events
```http
POST /events/batch
Content-Type: application/json

{
  "events": [
    {
      "user_id": 1,
      "product_id": 123,
      "event_type": "view",
      "user_session": "session_abc123"
    },
    {
      "user_id": 1,
      "product_id": 456,
      "event_type": "cart",
      "user_session": "session_abc123"
    }
  ]
}
```

---

## 2. Get Orchestrated Recommendations (MAIN ENDPOINT)

This is your primary recommendation endpoint. It automatically handles mode detection and source blending.

### POST Version (Full Control)
```http
POST /orchestrator/recommendations
Content-Type: application/json

{
  "user_id": 1,
  "total_limit": 20,
  "behavioral_weight": 0.3,
  "trending_weight": 0.2,
  "activity_weight": 0.5,
  "mmr_diversity": 0.7,  // 0-1, higher = more diverse (for browsing mode)
  "include_reasons": true
}
```

### GET Version (Simplified)
```http
GET /orchestrator/recommendations/{user_id}?limit=20&mmr_diversity=0.7&include_reasons=true
```

### Response Structure
```json
{
  "user_id": 1,
  "mode": "browsing",  // or "post_purchase", "cold_start"
  "mode_context": {
    "recent_interactions": 5
  },
  "total_count": 20,
  "sources_used": ["behavioral", "trending", "semantic_similar"],
  "strategy": "Exploring mode: Using semantic search with high diversity...",
  "recommendations": [
    {
      "product_id": 3701134,
      "score": 26517.0,
      "source": "trending",
      "reason": "Popular with 12542 users",
      "payload": {
        "title": "Product Name",
        "brand": "Brand Name",
        "category": "electronics",
        "price": 99.99
      }
    }
  ]
}
```

**When to call:**
- Homepage: Load recommendations on page load
- User dashboard: "For You" section
- After user interaction: Refresh recommendations
- After purchase: Get complementary products automatically

---

## 3. For You Page (Paginated Feed)

For infinite scroll or paginated recommendation feeds.

### POST Version
```http
POST /orchestrator/for-you
Content-Type: application/json

{
  "user_id": 1,
  "page": 1,
  "page_size": 20,
  "mmr_diversity": 0.7
}
```

### GET Version
```http
GET /orchestrator/for-you/{user_id}?page=1&page_size=20&mmr_diversity=0.7
```

### Response
```json
{
  "user_id": 1,
  "page": 1,
  "page_size": 20,
  "has_more": true,
  "mode": "browsing",
  "strategy": "Exploring mode...",
  "recommendations": [...]
}
```

**When to call:**
- Initial page load: `page=1`
- Infinite scroll: Increment page on scroll
- Pull to refresh: Reset to `page=1`

---

## 4. Get User Mode (Optional - for UI customization)

Check what mode the user is in to customize UI messaging.

```http
GET /orchestrator/user-mode/{user_id}?lookback_hours=24
```

### Response
```json
{
  "user_id": 1,
  "mode": "post_purchase",
  "context": {
    "has_purchase": true,
    "last_purchased_product_id": 456,
    "purchase_time": "2026-01-30 10:30:00"
  },
  "strategy_description": "Post-purchase mode: Showing complementary products..."
}
```

**Use cases:**
- Show different UI header: "Complete your setup" vs "Explore products"
- Customize empty states
- A/B testing different strategies

---

## 5. Individual Source Endpoints (Advanced)

If you want to display recommendations from specific sources separately.

### Behavioral Recommendations
```http
GET /orchestrator/behavioral/{user_id}?limit=10
```
Returns: "Users like you also liked..."

### Trending Products
```http
GET /orchestrator/trending?limit=10&event_type=purchase
```
- No filter: Overall trending
- `event_type=purchase`: Best sellers
- `event_type=cart`: Most added to cart

### Similar to Recent Activity
```http
POST /orchestrator/similar-to-recent
Content-Type: application/json

{
  "user_id": 1,
  "limit": 10,
  "use_mmr": true,
  "mmr_diversity": 0.7,
  "exclude_product_ids": [123, 456]
}
```
Returns: Products similar to recent views

### Complementary Products
```http
POST /orchestrator/complementary
Content-Type: application/json

{
  "user_id": 1,
  "purchased_product_id": 456,
  "limit": 10
}
```
Returns: "Complete your purchase" items

---

## Frontend Implementation Example

### React/Next.js Example

```typescript
// Track product view
const trackProductView = async (userId: number, productId: number) => {
  await fetch('/api/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      product_id: productId,
      event_type: 'view',
      user_session: sessionStorage.getItem('sessionId'),
    }),
  });
};

// Track purchase
const trackPurchase = async (userId: number, productId: number) => {
  await fetch('/api/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      product_id: productId,
      event_type: 'purchase',
      user_session: sessionStorage.getItem('sessionId'),
    }),
  });
};

// Get recommendations
const getRecommendations = async (userId: number) => {
  const response = await fetch(
    `/api/v1/orchestrator/recommendations/${userId}?limit=20&include_reasons=true`
  );
  return response.json();
};

// Component example
function RecommendationsSection({ userId }: { userId: number }) {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    getRecommendations(userId).then(setRecommendations);
  }, [userId]);

  if (!recommendations) return <Loading />;

  return (
    <div>
      <h2>
        {recommendations.mode === 'post_purchase' 
          ? 'Complete Your Setup' 
          : 'Recommended For You'}
      </h2>
      <p className="text-sm text-gray-600">{recommendations.strategy}</p>
      
      <div className="grid grid-cols-4 gap-4">
        {recommendations.recommendations.map((rec) => (
          <ProductCard 
            key={rec.product_id}
            product={rec.payload}
            reason={rec.reason}
            source={rec.source}
            onClick={() => trackProductView(userId, rec.product_id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Complete User Journey Flow

Here's how to implement the demo scenario in your frontend:

### 1. **New User Arrives (COLD_START)**
```typescript
// User lands on homepage
const recs = await getRecommendations(userId);
// Shows trending/popular items
// Mode: "cold_start"
```

### 2. **User Browses Products (COLD_START → BROWSING)**
```typescript
// User views 5 products
for (const productId of [101, 102, 103, 104, 105]) {
  await trackProductView(userId, productId);
}

// Get updated recommendations
const recs = await getRecommendations(userId);
// Now shows diverse recommendations based on viewed items
// Mode: "browsing"
// Sources: ["behavioral", "trending", "semantic_similar"]
```

### 3. **User Makes Purchase (BROWSING → POST_PURCHASE)**
```typescript
// User completes checkout
await trackPurchase(userId, 101);

// Get updated recommendations
const recs = await getRecommendations(userId);
// Now shows complementary products
// Mode: "post_purchase"
// Sources: ["behavioral", "trending", "complementary"]
```

### 4. **Show Recommendations Throughout**
```typescript
// Homepage
<ForYouPage userId={userId} />

// Product page
<SimilarProducts productId={currentProductId} />

// After purchase page
<CompleteYourSetup purchasedProductId={purchasedId} />
```

---

## Best Practices

### 1. **Always Track Events**
- Track ALL views, carts, and purchases
- Include session ID for better co-occurrence detection
- Track immediately (don't batch unless necessary)

### 2. **Refresh Recommendations**
- After user views 3-5 products
- Immediately after purchase
- On page refresh

### 3. **Handle Modes Gracefully**
```typescript
const getTitleForMode = (mode: string) => {
  switch (mode) {
    case 'cold_start':
      return 'Trending Now';
    case 'browsing':
      return 'Recommended For You';
    case 'post_purchase':
      return 'Complete Your Setup';
  }
};
```

### 4. **Show Source Badges** (Optional)
```typescript
const getSourceBadge = (source: string) => {
  switch (source) {
    case 'behavioral':
      return '👥 Users like you liked';
    case 'trending':
      return '🔥 Trending';
    case 'semantic_similar':
      return '🎯 Based on your activity';
    case 'complementary':
      return '✨ Complete your purchase';
  }
};
```

### 5. **Error Handling**
```typescript
try {
  const recs = await getRecommendations(userId);
  setRecommendations(recs);
} catch (error) {
  // Fallback to trending or cached recommendations
  console.error('Recommendations failed:', error);
  const trending = await fetch('/api/v1/orchestrator/trending?limit=20');
  setRecommendations(await trending.json());
}
```

---

## Testing the Integration

### 1. **Verify Event Tracking**
```bash
# Check if events are being recorded
curl http://localhost:8000/api/v1/orchestrator/user-mode/1
```

### 2. **Test Mode Transitions**
```bash
# Should show cold_start initially
curl http://localhost:8000/api/v1/orchestrator/recommendations/1

# After tracking views, should show browsing
# After tracking purchase, should show post_purchase
```

### 3. **Monitor Console**
- Open browser DevTools Network tab
- Filter for `/events` and `/orchestrator` endpoints
- Verify events are sending successfully (201 Created)
- Check recommendation responses for mode changes

---

## Performance Considerations

1. **Caching**: Cache recommendations for 5-10 minutes per user
2. **Lazy Loading**: Load recommendations after main content
3. **Infinite Scroll**: Use pagination (`/for-you` endpoint)
4. **Prefetching**: Prefetch next page while user scrolls
5. **Debouncing**: Don't refresh recommendations on every view (batch 3-5 views)

---

## Troubleshooting

### No Recommendations Returned
- **Issue**: User mode stuck in `cold_start`
- **Fix**: Verify events are being sent to `/events` endpoint
- **Check**: Events should go to Neo4j, not just PostgreSQL

### Always Shows Trending Items
- **Issue**: Not enough user history
- **Fix**: Track at least 3-5 views before expecting personalized results

### No Complementary Products
- **Issue**: Purchased product has no co-purchase data
- **Fix**: This is normal for new/rare products. System will show behavioral + trending instead.

### Mode Not Switching to POST_PURCHASE
- **Issue**: Purchase event not tracked or `lookback_hours` too short
- **Fix**: Ensure purchase event is sent and check within 24 hours

---

## Health Check

```http
GET /orchestrator/health
```

Returns service status:
```json
{
  "status": "healthy",
  "service": "orchestrator",
  "components": {
    "neo4j": "healthy",
    "qdrant": "healthy",
    "embedding_models": "ready"
  }
}
```

Check this endpoint before showing recommendations to ensure services are available.
