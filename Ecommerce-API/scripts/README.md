# Embedding Scripts

This folder contains all scripts for embedding products into the Qdrant vector database.

## Main Scripts

### `embed_products.py`
Core module for embedding products from CSV with images.

**Functions:**
- `embed_products()` - Embed products with multimodal (text + image) embeddings
- `search_products()` - Search products by text or image
- `demo_search()` - Run demo searches

**Usage:**
```python
from embed_products import embed_products

embed_products(
    csv_path="/path/to/products.csv",
    collection_name="products",
    limit=100
)
```

### `run_embedding.py`
Interactive runner script for embedding products.

**Usage:**
```bash
python scripts/run_embedding.py
```

**Options:**
1. Embed first 100 products (quick test)
2. Embed first 500 products
3. Embed first 1000 products
4. Embed ALL products (~6449)

## Example Scripts

### `embedding_example.py`
Demonstrates basic text-based product search using SENTENCE-BERT embeddings.

### `image_embedding_example.py`
Demonstrates image-based product search using CLIP vision embeddings.

### `simple_image_example.py`
Simple example with locally created test images.

### `amazon_products_indexer.py`
Script for indexing Amazon products from the large dataset.

### `test_amazon_search.py`
Test script for Amazon product search functionality.

## Quick Start

### 1. From Project Root
```bash
cd /home/adem/Desktop/DEBIAS
./start_embedding.sh
```

### 2. Directly from Scripts Folder
```bash
cd /home/adem/Desktop/DEBIAS/Ecommerce-API/scripts
python run_embedding.py
```

### 3. Custom Embedding
```python
import sys
sys.path.insert(0, '..')
from scripts.embed_products import embed_products

embed_products(
    csv_path="../data/products.csv",
    collection_name="my_products",
    limit=500
)
```

## Requirements

- Qdrant running on localhost:6333
- Python dependencies installed (fastembed, qdrant-client, etc.)
- CSV file with columns: product_id, title, brand, category, price, imgUrl

## Environment

All scripts automatically add the parent directory to the Python path, allowing imports from `app.services`.

## Notes

- First run downloads CLIP models (~600MB)
- Image downloads happen on-the-fly
- Progress is tracked with detailed logging
- Temporary files are cleaned up automatically
