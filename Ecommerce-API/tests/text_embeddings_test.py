import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service

# Test queries
test_queries = [
    "women's jeans",
    "sewing machine",
    "laptop computer",
    "notebook lenovo",
    "blue dress shirt"
]

print('📝 Text-Only Search Test')
print('=' * 80)

# Connect to Qdrant
qdrant_service.connect()

# Initialize CLIP text model (must match the model used during embedding)
print('Initializing CLIP text model...')
qdrant_service.initialize_text_embedding_model("Qdrant/clip-ViT-B-32-text")
print('✓ Model ready\n')

for query in test_queries:
    print(f'\n🔍 Query: "{query}"')
    print('-' * 80)
    
    # Search using text only
    results = qdrant_service.search(
        query_text=query,
        collection_name='products',
        limit=5
    )
    
    if results:
        print(f'\n✨ Found {len(results)} semantically similar products:')
        
        for i, result in enumerate(results, 1):
            print(f'\n  {i}. {result["payload"]["title"][:65]}')
            print(f'     Brand: {result["payload"]["brand"]}')
            print(f'     Category: {result["payload"]["category"]}')
            print(f'     Price: ${result["payload"]["price"]:.2f}')
            print(f'     Similarity Score: {result["score"]:.4f}')
    else:
        print('   ⚠️  No results found')
    
    print()

print('=' * 80)
print('✅ Text search test completed!')
