import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service

# Path to the test image (adjust based on where script is run from)
image_path = os.path.join(os.path.dirname(__file__), 'image.png')

if not os.path.exists(image_path):
    print(f'❌ Image not found: {image_path}')
    exit(1)

print('🖼️  Searching for products similar to tests/image.png...')
print('=' * 80)

# Connect and search
qdrant_service.connect()

# Search directly using the local image file
results = qdrant_service.search(
    query_image=image_path,
    collection_name='products',
    limit=10
)

print(f'\n✨ Found {len(results)} visually similar products!')
print('=' * 80)

for i, result in enumerate(results, 1):
    print(f'\n{i}. {result["payload"]["title"][:70]}')
    print(f'   Brand: {result["payload"]["brand"]}')
    print(f'   Category: {result["payload"]["category"]}')
    print(f'   Price: ${result["payload"]["price"]:.2f}')
    print(f'   Visual Similarity Score: {result["score"]:.4f}')
    print(f'   Image: {result["payload"]["image_url"][:70]}...')