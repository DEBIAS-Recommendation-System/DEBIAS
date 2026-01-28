import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service

print("🔍 Category Filtering Test")
print("=" * 80)

# Connect to Qdrant
qdrant_service.connect()

# Initialize CLIP text model
print("\nInitializing CLIP text model...")
qdrant_service.initialize_text_embedding_model("Qdrant/clip-ViT-B-32-text")
print("✓ Model ready\n")

# Test different category filters
categories_to_test = [
    ("apparel.jeans", "comfortable jeans"),
    ("computers.notebook", "laptop for work"),
    ("appliances.sewing_machine", "sewing machine"),
    ("apparel.shirt", "dress shirt"),
]

for category, query in categories_to_test:
    print("=" * 80)
    print(f"Category: {category}")
    print(f'Query: "{query}"')
    print("-" * 80)

    # Search with filter
    results = qdrant_service.search(
        query_text=query,
        collection_name="products",
        limit=5,
        filter_conditions={"category": category},
    )

    if results:
        print(f"\n✨ Found {len(results)} products in {category}:")

        for i, result in enumerate(results, 1):
            print(f"\n  {i}. {result['payload']['title'][:65]}")
            print(f"     Brand: {result['payload']['brand']}")
            print(f"     Category: {result['payload']['category']}")
            print(f"     Price: ${result['payload']['price']:.2f}")
            print(f"     Similarity: {result['score']:.4f}")
    else:
        print(f"\n⚠️  No products found in {category}")

    print()

# Comparison: Same query with and without filter
print("=" * 80)
print("COMPARISON: With vs Without Filter")
print("=" * 80)

test_query = "laptop computer"

# Without filter
print(f'\n1. Search WITHOUT filter: "{test_query}"')
print("-" * 80)
unfiltered = qdrant_service.search(
    query_text=test_query, collection_name="products", limit=5
)

print(f"Found {len(unfiltered)} products (any category):")
for i, result in enumerate(unfiltered, 1):
    print(f"  {i}. {result['payload']['title'][:50]}")
    print(
        f"     Category: {result['payload']['category']} | Score: {result['score']:.4f}"
    )

# With filter
print(f'\n2. Search WITH filter: "{test_query}" (computers.notebook only)')
print("-" * 80)
filtered = qdrant_service.search(
    query_text=test_query,
    collection_name="products",
    limit=5,
    filter_conditions={"category": "computers.notebook"},
)

print(f"Found {len(filtered)} products (computers.notebook):")
for i, result in enumerate(filtered, 1):
    print(f"  {i}. {result['payload']['title'][:50]}")
    print(f"     Brand: {result['payload']['brand']} | Score: {result['score']:.4f}")

print("\n" + "=" * 80)
print("✅ Category filtering test completed!")
print("=" * 80)
print("\n💡 Benefits of Category Filtering:")
print("   • Narrows search to specific product types")
print("   • Improves relevance for focused queries")
print("   • Enables department/category-specific search")
print("   • Works seamlessly with semantic similarity")
