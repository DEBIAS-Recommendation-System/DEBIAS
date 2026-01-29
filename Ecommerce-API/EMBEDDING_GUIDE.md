# Product Embedding Guide

This guide explains how to embed products from the `/data/products.csv` file with their images into Qdrant vector database for semantic and visual search.

## Overview

The embedding system uses **CLIP (Contrastive Language-Image Pre-training)** to create multimodal embeddings that enable:
- **Text search**: Find products using natural language queries
- **Image search**: Find visually similar products using image URLs
- **Cross-modal search**: Search products by text and get results based on both text and visual features

## Prerequisites

1. **Qdrant running**: Make sure Qdrant is running on `localhost:6333`
   ```bash
   docker-compose up -d qdrant
   ```

2. **Python dependencies installed**:
   ```bash
   pip install -r requirements.txt
   ```

## Quick Start

### Option 1: Using the Runner Script (Recommended)

```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API
python run_embedding.py
```

The script will:
1. Ask you how many products to embed (100, 500, 1000, or all ~6449)
2. Connect to Qdrant
3. Download CLIP models (first run only)
4. Download product images and create embeddings
5. Optionally run demo searches

### Option 2: Using Python Directly

```python
from app.services.embed_products import embed_products, search_products

# Embed first 100 products (quick test)
embed_products(
    csv_path="/home/adem/Desktop/DEBIAS/data/products.csv",
    collection_name="products",
    limit=100
)

# Search by text
search_products(
    query_text="women's blue jeans",
    collection_name="products",
    limit=5
)

# Search by image URL
search_products(
    query_image_url="https://m.media-amazon.com/images/I/81hZc7HlgBL._AC_UL320_.jpg",
    collection_name="products",
    limit=5
)
```

## CSV Format

The script expects a CSV file with the following columns:
```
product_id,title,brand,category,price,imgUrl
```

Example:
```
17302001,Girl's Chloe Skinny Jeans,chloe,apparel.jeans,85.8,https://...jpg
```

## Features

### Multimodal Embeddings
- **Text embeddings**: Created from product title, brand, and category
- **Image embeddings**: Created from product images using CLIP-ViT-B-32-vision
- **Combined search**: Both modalities stored in the same 512-dimensional vector space

### Smart Processing
- Downloads images on-the-fly
- Handles image format conversions (RGB)
- Automatic cleanup of temporary files
- Rate limiting to avoid overloading image servers
- Progress tracking with detailed logs

### Deduplication
- Uses `product_id` as unique identifier
- Prevents duplicate embeddings

## Performance Considerations

- **First 100 products**: ~5-10 minutes (good for testing)
- **First 1000 products**: ~30-60 minutes
- **All products (~6449)**: ~3-5 hours

Factors affecting speed:
- Image download speeds
- Your internet connection
- Qdrant server performance
- First-time model downloads

## Example Searches

### Text-Based Searches
```python
from app.services.embed_products import search_products

# Find women's clothing
search_products(query_text="women's jeans", limit=5)

# Find electronics
search_products(query_text="laptop computer", limit=5)

# Find specific brands
search_products(query_text="singer sewing machine", limit=5)
```

### Image-Based Searches
```python
# Find similar products by image
search_products(
    query_image_url="https://m.media-amazon.com/images/I/81hZc7HlgBL._AC_UL320_.jpg",
    limit=5
)
```

## Collection Management

### Check Collection Info
```python
from app.services.qdrant_service import qdrant_service

qdrant_service.connect()
info = qdrant_service.get_collection_info("products")
print(f"Products indexed: {info['points_count']}")
```

### Delete Collection (Start Fresh)
```python
from app.services.qdrant_service import qdrant_service

qdrant_service.connect()
qdrant_service.client.delete_collection("products")
```

## Troubleshooting

### Qdrant Connection Error
```
Failed to connect to Qdrant: Connection refused
```
**Solution**: Make sure Qdrant is running
```bash
docker-compose up -d qdrant
```

### Image Download Failures
Some images may fail to download due to:
- Expired URLs
- Rate limiting
- Network issues

The script will skip failed images and continue with others.

### Out of Memory
If embedding many products causes memory issues:
1. Reduce batch size in the script
2. Process in smaller chunks (e.g., 500 at a time)
3. Increase your system's available RAM

## API Integration

To use the embeddings in your FastAPI application:

```python
from fastapi import APIRouter
from app.services.qdrant_service import qdrant_service

router = APIRouter()

@router.get("/search/products")
async def search_products(query: str, limit: int = 10):
    """Search products by text query"""
    results = qdrant_service.search(
        query_text=query,
        limit=limit,
        collection_name="products"
    )
    return {"results": results}

@router.get("/search/similar")
async def search_similar(image_url: str, limit: int = 10):
    """Find visually similar products"""
    # Download image temporarily
    import tempfile
    temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    # ... download logic ...
    
    results = qdrant_service.search(
        query_image=temp_file.name,
        limit=limit,
        collection_name="products"
    )
    return {"results": results}
```

## Advanced Usage

### Custom Collection Name
```python
embed_products(
    csv_path="/path/to/products.csv",
    collection_name="my_custom_collection",
    limit=100
)
```

### Batch Processing
```python
# Process in smaller batches
for offset in range(0, 6449, 500):
    # Implement pagination in load_products_from_csv
    embed_products(csv_path, limit=500, offset=offset)
```

## Model Information

- **Text Model**: `Qdrant/clip-ViT-B-32-text`
  - 512-dimensional embeddings
  - Trained on 400M image-text pairs
  - Supports cross-modal search

- **Image Model**: `Qdrant/clip-ViT-B-32-vision`
  - 512-dimensional embeddings
  - Compatible with text model embeddings
  - Efficient for visual similarity

## Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [FastEmbed Documentation](https://qdrant.github.io/fastembed/)
