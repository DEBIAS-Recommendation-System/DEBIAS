# Recommendations API Endpoint

## Overview

The Recommendations API endpoint provides intelligent product recommendations using vector similarity search powered by Qdrant. It supports text queries, image queries, and multimodal (combined text + image) queries with optional filtering capabilities.

## Endpoint

**POST** `/recommendations/`

Returns personalized product recommendations based on query input.

**GET** `/recommendations/health`

Health check endpoint to verify service status.

---

## Features

- **Text-based search**: Find products using natural language queries
- **Image-based search**: Find visually similar products using image input
- **Multimodal search**: Combine text and image for enhanced results
- **Flexible filtering**: Filter by category, brand, or any product attribute
- **Configurable results**: Control result count and similarity threshold

---

## Request Schema

### RecommendationRequest

```json
{
  "query_text": "string (optional)",
  "query_image": "string (optional)",
  "limit": "integer (1-100, default: 10)",
  "score_threshold": "float (0-1, optional)",
  "filters": {
    "key": "value"
  }
}
```

**Fields:**

- `query_text` *(optional)*: Natural language text query (e.g., "comfortable running shoes")
- `query_image` *(optional)*: URL or file path to an image for visual similarity search
- `limit` *(optional)*: Maximum number of recommendations to return (default: 10, max: 100)
- `score_threshold` *(optional)*: Minimum similarity score (0-1). Only results above this threshold are returned
- `filters` *(optional)*: Dictionary of key-value pairs to filter results (e.g., `{"category": "Electronics"}`)

**Note:** At least one of `query_text` or `query_image` must be provided.

---

## Response Schema

### RecommendationResponse

```json
{
  "query_type": "text|image|multimodal",
  "total_results": 10,
  "recommendations": [
    {
      "id": 12345,
      "score": 0.89,
      "title": "Product Title",
      "brand": "Brand Name",
      "category": "Category Name",
      "price": 99.99,
      "image_url": "https://...",
      "description": "Product description"
    }
  ],
  "filters_applied": {
    "category": "Electronics"
  }
}
```

**Fields:**

- `query_type`: Type of query executed ("text", "image", or "multimodal")
- `total_results`: Number of recommendations returned
- `recommendations`: Array of recommended products
  - `id`: Product ID from the database
  - `score`: Similarity score (0-1, higher is more similar)
  - `title`: Product title
  - `brand`: Product brand (if available)
  - `category`: Product category (if available)
  - `price`: Product price (if available)
  - `image_url`: Product image URL (if available)
  - `description`: Product description (if available)
- `filters_applied`: Filters that were applied to the search

---

## Usage Examples

### 1. Text-Based Search

Find products using natural language:

```bash
curl -X POST "http://localhost:8000/recommendations/" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "comfortable running shoes",
    "limit": 5
  }'
```

**Python:**

```python
import requests

response = requests.post(
    "http://localhost:8000/recommendations/",
    json={
        "query_text": "comfortable running shoes",
        "limit": 5
    }
)
results = response.json()
```

### 2. Text Search with Filters

Search within a specific category:

```bash
curl -X POST "http://localhost:8000/recommendations/" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "laptop",
    "limit": 10,
    "score_threshold": 0.7,
    "filters": {
      "category": "Electronics",
      "brand": "Dell"
    }
  }'
```

### 3. Image-Based Search

Find visually similar products:

```bash
curl -X POST "http://localhost:8000/recommendations/" \
  -H "Content-Type: application/json" \
  -d '{
    "query_image": "https://example.com/product-image.jpg",
    "limit": 5
  }'
```

**Python:**

```python
import requests

response = requests.post(
    "http://localhost:8000/recommendations/",
    json={
        "query_image": "https://example.com/product.jpg",
        "limit": 5,
        "filters": {"category": "Fashion"}
    }
)
results = response.json()
```

### 4. Multimodal Search (Text + Image)

Combine text and image for enhanced results:

```bash
curl -X POST "http://localhost:8000/recommendations/" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "blue casual dress",
    "query_image": "https://example.com/dress.jpg",
    "limit": 10,
    "score_threshold": 0.6
  }'
```

### 5. Health Check

Check if the service is operational:

```bash
curl -X GET "http://localhost:8000/recommendations/health"
```

**Response:**

```json
{
  "status": "healthy",
  "message": "Recommendation service is operational",
  "models_initialized": true,
  "text_model_ready": true,
  "image_model_ready": true,
  "collection": "products",
  "indexed_products": 15000
}
```

---

## Error Responses

### 400 Bad Request

When neither text nor image query is provided:

```json
{
  "detail": "At least one of 'query_text' or 'query_image' must be provided"
}
```

### 500 Internal Server Error

When there's an issue processing the request:

```json
{
  "detail": "Failed to process recommendation request: [error details]"
}
```

---

## Technical Details

### Vector Search Technology

The endpoint uses:
- **Qdrant**: High-performance vector database for similarity search
- **CLIP Models**: 
  - Text: `Qdrant/clip-ViT-B-32-text` (512 dimensions)
  - Image: `Qdrant/clip-ViT-B-32-vision` (512 dimensions)
- **Cosine Similarity**: Distance metric for comparing embeddings

### Performance Considerations

- **Embedding Generation**: 
  - Text embeddings: ~10-50ms per query
  - Image embeddings: ~50-200ms per query
- **Vector Search**: Typically <100ms for collections up to 1M vectors
- **Filters**: Applied during search, minimal performance impact

### Filtering

Filters use exact matching on metadata fields. Common filterable fields:
- `category`: Product category
- `brand`: Product brand
- `price`: Product price (use range filters)
- Any other metadata stored in the Qdrant collection

Multiple filters are combined with AND logic.

---

## Integration Example

```python
from typing import List, Dict, Any
import requests

class RecommendationClient:
    """Client for the Recommendations API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def get_recommendations(
        self,
        query_text: str = None,
        query_image: str = None,
        limit: int = 10,
        score_threshold: float = None,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Get product recommendations"""
        
        payload = {
            "limit": limit
        }
        
        if query_text:
            payload["query_text"] = query_text
        if query_image:
            payload["query_image"] = query_image
        if score_threshold:
            payload["score_threshold"] = score_threshold
        if filters:
            payload["filters"] = filters
        
        response = requests.post(
            f"{self.base_url}/recommendations/",
            json=payload
        )
        response.raise_for_status()
        
        return response.json()["recommendations"]
    
    def is_healthy(self) -> bool:
        """Check if service is healthy"""
        try:
            response = requests.get(f"{self.base_url}/recommendations/health")
            data = response.json()
            return data["status"] == "healthy"
        except:
            return False

# Usage
client = RecommendationClient()

# Text search
recommendations = client.get_recommendations(
    query_text="wireless headphones",
    limit=5,
    filters={"category": "Electronics"}
)

# Image search
recommendations = client.get_recommendations(
    query_image="https://example.com/shoe.jpg",
    limit=10
)
```

---

## Testing

Run the test suite:

```bash
python tests/test_recommendations_api.py
```

This will test:
1. Health check endpoint
2. Text-based search
3. Text search with filters
4. Image-based search
5. Multimodal search
6. Error handling

---

## Related Documentation

- [Qdrant Service Documentation](../app/services/qdrant_service.py)
- [Product Embedding Guide](../PRODUCT_EMBEDDING_README.md)
- [API Main Documentation](../README.md)
