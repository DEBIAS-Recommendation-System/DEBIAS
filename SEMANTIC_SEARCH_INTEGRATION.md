# Semantic Search Integration

This document explains the integration between the frontend products page and the Qdrant-powered semantic search backend.

## Overview

The semantic search feature allows users to search for products using natural language queries. Instead of exact keyword matching, it uses AI embeddings (CLIP model) to understand the meaning and context of search queries.

## Architecture

### Backend (`Ecommerce-API`)

**Endpoint**: `GET /products/search/semantic`

**File**: `app/routers/products.py`

**Service**: `app/services/qdrant_service.py`

**How it works**:
1. User query is converted to a 512-dimensional vector using CLIP text embedding model
2. Qdrant performs cosine similarity search against indexed product embeddings
3. Top similar products are retrieved with similarity scores
4. Full product details are fetched from PostgreSQL database
5. Results are sorted by similarity score and returned

**Query Parameters**:
- `query` (required): Natural language search query
- `limit` (optional, default: 10): Number of results to return
- `score_threshold` (optional): Minimum similarity score (0-1)
- `category` (optional): Filter by category
- `use_mmr` (optional, default: false): Enable Maximal Marginal Relevance for diverse results
- `mmr_diversity` (optional, default: 0.5): Balance between relevance and diversity

**Example Request**:
```bash
GET /products/search/semantic?query=comfortable running shoes&limit=6&use_mmr=true&mmr_diversity=0.3
```

**Example Response**:
```json
{
  "data": [
    {
      "product_id": 12345,
      "title": "Nike Air Max Running Shoes",
      "price": 129.99,
      "brand": "Nike",
      "category": "Footwear",
      "imgUrl": "https://..."
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 6,
  "query_type": "semantic",
  "scores": {
    "12345": 0.89
  }
}
```

### Frontend (`Ecommerce Frontend`)

**Component**: `src/app/(dashboard)/products/ui/SemanticSearchBar.tsx`

**Integration Point**: `src/app/(dashboard)/products/page.tsx`

**Features**:
- ✅ Real-time search with 500ms debounce
- ✅ Loading states with spinner
- ✅ Similarity score display (% match)
- ✅ Product thumbnails and pricing
- ✅ Click to navigate to product details
- ✅ Backdrop overlay for focus
- ✅ AI badge indicator
- ✅ MMR enabled for diverse results

**User Experience**:
1. User types natural language query (e.g., "blue jeans for women")
2. After 500ms of no typing, search is triggered
3. Results appear in dropdown with similarity scores
4. Click on result navigates to product detail page
5. Click outside or clear search to close results

## Setup Requirements

### Backend Setup

1. **Qdrant must be running**:
   ```bash
   docker-compose up -d qdrant
   ```

2. **Products must be indexed**:
   ```bash
   cd Ecommerce-API
   python scripts/run_embedding.py
   ```

3. **Environment variables** (`.env`):
   ```env
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   QDRANT_COLLECTION_NAME=products
   ```

### Frontend Setup

1. **API URL configured** (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Dependencies installed**:
   - `lodash.debounce` - for search debouncing
   - `lucide-react` - for Sparkles icon

## Key Technologies

### CLIP Embeddings
- **Text Model**: `Qdrant/clip-ViT-B-32-text`
- **Vector Dimension**: 512
- **Distance Metric**: Cosine similarity
- **Advantage**: Cross-modal understanding (text and images in same space)

### MMR (Maximal Marginal Relevance)
- **Purpose**: Provide diverse results, not just most similar
- **Diversity Parameter**: 0.3 (30% diversity, 70% relevance)
- **Benefit**: Prevents repetitive/similar products in results

## Example Queries

Natural language queries that work well:

- ✅ "comfortable running shoes"
- ✅ "blue jeans for women"
- ✅ "wireless headphones with noise cancelling"
- ✅ "laptop for gaming"
- ✅ "black dress for formal occasion"
- ✅ "children's toys educational"

## Fallback Behavior

If Qdrant search fails (service down, connection error, etc.), the endpoint automatically falls back to regular PostgreSQL text search using `LIKE` operator.

## Performance Considerations

- **Search Speed**: ~50-200ms for Qdrant search
- **Debounce Delay**: 500ms to reduce API calls
- **Result Limit**: Default 6 for dropdown (configurable)
- **Caching**: React Query caches API responses

## Future Enhancements

Potential improvements:

1. **Image Search**: Upload/paste image to find similar products
2. **Search History**: Store recent searches
3. **Autocomplete**: Suggest queries as user types
4. **Filters in Search**: Apply category/price filters to semantic results
5. **Relevance Feedback**: Let users mark results as relevant/irrelevant to improve future searches
6. **Hybrid Search**: Combine semantic and keyword search for best results

## Troubleshooting

**No results appearing**:
- Check if Qdrant is running: `docker ps | grep qdrant`
- Verify products are indexed: Check collection in Qdrant dashboard
- Check API URL in frontend `.env.local`

**Slow search**:
- Reduce debounce delay (currently 500ms)
- Decrease result limit
- Check Qdrant server resources

**Poor result quality**:
- Ensure products are properly embedded with correct model
- Try adjusting MMR diversity parameter
- Check if query is too vague

## Code Reference

### Backend Endpoint
```python
# Ecommerce-API/app/routers/products.py
@router.get("/search/semantic", status_code=status.HTTP_200_OK)
def semantic_search_products(
    query: str = Query(...),
    limit: int = Query(10, ge=1, le=100),
    use_mmr: bool = Query(False),
    mmr_diversity: float = Query(0.5, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
):
    # ... implementation
```

### Frontend Component
```tsx
// Ecommerce Frontend/src/app/(dashboard)/products/ui/SemanticSearchBar.tsx
export default function SemanticSearchBar() {
  const searchProducts = async (query: string) => {
    const params = new URLSearchParams({
      query,
      limit: "6",
      use_mmr: "true",
      mmr_diversity: "0.3",
    });

    const response = await fetch(
      `${API_URL}/products/search/semantic?${params}`
    );
    // ... handle response
  };
  // ... implementation
}
```

## Related Documentation

- [Qdrant Service Documentation](../Ecommerce-API/app/services/qdrant_service.py)
- [Embedding Guide](../Ecommerce-API/EMBEDDING_GUIDE.md)
- [Recommendations API](../Ecommerce-API/RECOMMENDATIONS_API.md)
