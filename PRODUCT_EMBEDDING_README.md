# Product Embedding - Quick Start Guide

This directory contains scripts to embed products from `/data/products.csv` with their images into Qdrant vector database for semantic and visual search.

## 🚀 Quick Start

### 1. Start Qdrant and Test Setup

```bash
cd /home/adem/Desktop/DEBIAS
./start_embedding.sh
```

This will:
- Start Qdrant vector database
- Test the connection
- Run the embedding script

### 2. Run Tests (Optional)

To verify everything is set up correctly:

```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API
python test_embedding_setup.py
```

## 📁 Files Overview

### Main Scripts

- **`start_embedding.sh`** - Complete setup and embedding script (recommended)
- **`Ecommerce-API/scripts/run_embedding.py`** - Interactive embedding script
- **`Ecommerce-API/test_embedding_setup.py`** - Verify setup is working

### Core Module

- **`Ecommerce-API/scripts/embed_products.py`** - Main embedding implementation

### Documentation

- **`Ecommerce-API/EMBEDDING_GUIDE.md`** - Comprehensive documentation

## 🎯 What Gets Embedded

The script processes products from `/data/products.csv`:
- **Product ID**: Unique identifier
- **Title**: Product name
- **Brand**: Brand name
- **Category**: Product category
- **Price**: Product price
- **Image**: Product image (downloaded and embedded)

## 🔍 Features

### Multimodal Search
- **Text Search**: "women's blue jeans", "laptop computer"
- **Image Search**: Find visually similar products
- **Cross-Modal**: Text queries work on image embeddings!

### Technology
- **CLIP Models**: State-of-the-art multimodal embeddings
- **512 Dimensions**: Efficient vector representation
- **Qdrant**: High-performance vector database

## 📊 Processing Options

When you run `./start_embedding.sh`, you'll be asked:

```
How many products to embed?
  1. Embed first 100 products (quick test) - ~5 minutes
  2. Embed first 500 products - ~30 minutes  
  3. Embed first 1000 products - ~60 minutes
  4. Embed ALL products (~6449) - ~3-5 hours
```

## 💡 Usage Examples

### Python API

```python
import sys
sys.path.insert(0, 'Ecommerce-API/scripts')
from embed_products import search_products

# Text search
results = search_products(
    query_text="women's jeans",
    collection_name="products",
    limit=5
)

# Image search
results = search_products(
    query_image_url="https://m.media-amazon.com/images/I/81hZc7HlgBL._AC_UL320_.jpg",
    collection_name="products",
    limit=5
)
```

### FastAPI Endpoint (example)

```python
from fastapi import APIRouter
from app.services.qdrant_service import qdrant_service

@router.get("/products/search")
async def search(q: str, limit: int = 10):
    results = qdrant_service.search(
        query_text=q,
        limit=limit,
        collection_name="products"
    )
    return {"results": results}
```

## 🔧 Troubleshooting

### Qdrant Not Running

```bash
docker compose up -d qdrant
docker compose logs qdrant
```

### Test Connection

```bash
curl http://localhost:6333/health
```

### Check Embedded Products

```python
from app.services.qdrant_service import qdrant_service

qdrant_service.connect()
info = qdrant_service.get_collection_info("products")
print(f"Products embedded: {info['points_count']}")
```

### Reset Collection

```python
from app.services.qdrant_service import qdrant_service

qdrant_service.connect()
qdrant_service.client.delete_collection("products")
```

## 📚 Additional Resources

- **Full Guide**: See `Ecommerce-API/EMBEDDING_GUIDE.md`
- **Qdrant Docs**: https://qdrant.tech/documentation/
- **CLIP Paper**: https://arxiv.org/abs/2103.00020

## 🎬 Demo Searches

After embedding, the script runs demo searches:
- "women's jeans"
- "sewing machine"
- "laptop computer"
- "notebook lenovo"

## ⚙️ Configuration

Edit these in the scripts if needed:
- **CSV Path**: `/home/adem/Desktop/DEBIAS/data/products.csv`
- **Collection Name**: `products`
- **Batch Size**: `10` (products processed before pause)
- **Vector Size**: `512` (CLIP dimension)

## 🚦 Status Indicators

During embedding, you'll see:
- **✅** Success - Product embedded
- **❌** Failed - Image download or embedding failed
- **⚠️** Warning - Non-critical issue
- **📊** Progress - Batch completion updates

## ⏱️ Performance

Factors affecting speed:
- Image download speeds
- Internet connection
- Qdrant performance
- First-time model downloads (~500MB)

## 🎯 Next Steps

After embedding:
1. Integrate search into your FastAPI endpoints
2. Add filters (category, brand, price range)
3. Implement ranking/scoring logic
4. Build UI for product search
5. Add caching for common queries

---

**Need Help?** Check `EMBEDDING_GUIDE.md` for detailed documentation!
