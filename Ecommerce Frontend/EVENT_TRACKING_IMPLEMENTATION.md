# Event Tracking Implementation for Neo4j Behavioral Recommendations

## Overview
This document describes the complete implementation of user behavior event tracking system that sends events to Neo4j via FastAPI endpoints for personalized product recommendations.

## Event Types
Three event types are tracked and sent to Neo4j:

1. **View Events**: Sent when a user visits a product page
2. **Cart Events**: Sent when a user adds a product to cart
3. **Purchase Events**: Sent when a user completes an order (batch)

## API Endpoints

### Single Event
- **Endpoint**: `POST /events/`
- **Usage**: View and Cart events
- **Payload**:
```typescript
{
  event_type: "view" | "cart",
  product_id: number,
  user_session: string,
  user_id?: number  // Optional, for authenticated users
}
```

### Batch Events
- **Endpoint**: `POST /events/batch`
- **Usage**: Purchase events (multiple products at once)
- **Payload**:
```typescript
[
  {
    event_type: "purchase",
    product_id: number,
    user_session: string,
    user_id?: number
  },
  // ... more events
]
```

## Implementation Details

### 1. Event Tracking Actions
**File**: `src/actions/sendEvent.ts`

Core functions:
- `getSessionId()`: Creates or retrieves anonymous session ID from localStorage
- `sendEvent()`: Sends single event to `/events/` endpoint
- `sendBatchEvents()`: Sends multiple events to `/events/batch` endpoint

### 2. View Event Tracking
**File**: `src/components/ProductDetails.tsx`

Implementation:
```typescript
useEffect(() => {
  if (product?.product_id) {
    const sessionId = getSessionId();
    sendEvent({
      event_type: "view",
      product_id: product.product_id,
      user_session: sessionId,
    });
  }
}, [product]);
```

**Trigger**: Automatically when product page loads

### 3. Cart Event Tracking
**File**: `src/actions/Cart/addToCart.ts`

Implementation:
```typescript
// After adding to cart in localStorage
const sessionId = getSessionId();
await sendEvent({
  event_type: "cart",
  product_id: productId,
  user_session: sessionId,
});
```

**Trigger**: When user clicks "Add to Cart" button

### 4. Purchase Event Tracking
**File**: `src/hooks/data/orders/createOrder.ts`

Implementation:
```typescript
onSuccess: async () => {
  const sessionId = getSessionId();
  const purchaseEvents = cart.data.map((item) => ({
    event_type: "purchase",
    product_id: item.product_id,
    user_session: sessionId,
  }));
  await sendBatchEvents(purchaseEvents);
}
```

**Trigger**: When user successfully completes order (after validation and email confirmation)

## Session Management

### Anonymous Tracking
- Session ID is generated using `crypto.randomUUID()`
- Stored in localStorage with key: `"user_session"`
- Persists across page reloads
- Unique per browser/device

### Session ID Generation
```typescript
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("user_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("user_session", sessionId);
  }
  return sessionId;
}
```

## Error Handling

All event tracking is implemented with non-blocking error handling:
- View/Cart events: Errors logged to console, don't disrupt user experience
- Purchase events: Errors logged but order completion proceeds normally

Example:
```typescript
try {
  await sendEvent({...});
} catch (error) {
  console.error("Failed to send event:", error);
  // User flow continues normally
}
```

## Data Flow

```
User Action → Frontend Event → FastAPI Endpoint → Neo4j Database
                                                         ↓
                                               Recommendation Engine
```

### Example Flow for Product View:
1. User navigates to `/products/123`
2. ProductDetails component mounts
3. useEffect detects product load
4. getSessionId() retrieves/creates session
5. sendEvent() posts to `/events/`
6. FastAPI receives event
7. EventService stores in Neo4j
8. Event available for recommendation queries

## Testing Event Tracking

### Manual Testing
1. **View Event**:
   - Navigate to any product page
   - Check browser Network tab for POST to `/events/`
   - Verify payload contains: `event_type: "view"`, `product_id`, `user_session`

2. **Cart Event**:
   - Click "Add to Cart" on any product
   - Check Network tab for POST to `/events/`
   - Verify payload contains: `event_type: "cart"`, `product_id`, `user_session`

3. **Purchase Event**:
   - Complete full checkout flow (address + payment + confirm)
   - Check Network tab for POST to `/events/batch`
   - Verify payload is array with all purchased products
   - Each event should have: `event_type: "purchase"`, `product_id`, `user_session`

### Console Verification
Check localStorage in browser DevTools:
```javascript
localStorage.getItem('user_session')  // Should return UUID
localStorage.getItem('cart')          // Should contain cart items with product_id
```

## Benefits

1. **Personalized Recommendations**: Events feed Neo4j graph for collaborative filtering
2. **Behavioral Analysis**: Track user journey from view → cart → purchase
3. **Session-Based**: Works for both anonymous and authenticated users
4. **Non-Intrusive**: Event tracking failures don't affect user experience
5. **Scalable**: Batch processing for purchase events reduces API calls

## Future Enhancements

Potential improvements:
- Add `search` event type for semantic search queries
- Track `wishlist` events
- Add timestamp metadata
- Implement event debouncing for rapid interactions
- Add user authentication ID when logged in
- Track product categories in events
- Implement event replay for failed submissions

## File Locations

Key files in this implementation:
- Actions: `src/actions/sendEvent.ts`
- View Tracking: `src/components/ProductDetails.tsx`
- Cart Tracking: `src/actions/Cart/addToCart.ts`
- Purchase Tracking: `src/hooks/data/orders/createOrder.ts`
- Types: `src/types/database.tables.types.ts` (EventCreate interface)

## Backend Integration

FastAPI endpoints (running on port 8000):
- `/events/` - Single event ingestion
- `/events/batch` - Batch event ingestion
- `/recommendations/similar/{product_id}` - Powered by view events
- `/recommendations/user/{user_id}` - Powered by cart/purchase events

Neo4j stores events as relationships in graph database for efficient recommendation queries.
