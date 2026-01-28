import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service

# Path to the test image
image_path = os.path.join(os.path.dirname(__file__), "image.png")

print("🎨 Multimodal Search Test - Image + Text")
print("=" * 80)

if not os.path.exists(image_path):
    print(f"❌ Image not found: {image_path}")
    exit(1)

# Connect to Qdrant
qdrant_service.connect()

# Initialize CLIP multimodal models
print("\nInitializing CLIP multimodal models...")
qdrant_service.initialize_multimodal_models(
    text_model="Qdrant/clip-ViT-B-32-text", image_model="Qdrant/clip-ViT-B-32-vision"
)
print("✓ Models ready\n")

# Test 1: Image-only search
print("\n" + "=" * 80)
print("TEST 1: Image-Only Search")
print("=" * 80)
print(f"🖼️  Searching with image: {os.path.basename(image_path)}")

image_results = qdrant_service.search(
    query_image=image_path, collection_name="products", limit=5
)

print(f"\n✨ Found {len(image_results)} visually similar products:")
print("-" * 80)

for i, result in enumerate(image_results, 1):
    print(f"\n{i}. {result['payload']['title'][:70]}")
    print(f"   Brand: {result['payload']['brand']}")
    print(f"   Category: {result['payload']['category']}")
    print(f"   Price: ${result['payload']['price']:.2f}")
    print(f"   Visual Similarity Score: {result['score']:.4f}")

# Test 2: Text-only search
print("\n" + "=" * 80)
print("TEST 2: Text-Only Search")
print("=" * 80)

test_query = "penis"
print(f'📝 Searching with text: "{test_query}"')

text_results = qdrant_service.search(
    query_text=test_query, collection_name="products", limit=5
)

print(f"\n✨ Found {len(text_results)} semantically similar products:")
print("-" * 80)

for i, result in enumerate(text_results, 1):
    print(f"\n{i}. {result['payload']['title'][:70]}")
    print(f"   Brand: {result['payload']['brand']}")
    print(f"   Category: {result['payload']['category']}")
    print(f"   Price: ${result['payload']['price']:.2f}")
    print(f"   Text Similarity Score: {result['score']:.4f}")

# Test 3: Compare results
print("\n" + "=" * 80)
print("TEST 3: Comparison - Image vs Text Results")
print("=" * 80)

# Get product IDs from both searches
image_ids = {result["id"] for result in image_results}
text_ids = {result["id"] for result in text_results}

common_ids = image_ids.intersection(text_ids)

print(f"\n📊 Analysis:")
print(f"   • Image search returned: {len(image_results)} products")
print(f"   • Text search returned: {len(text_results)} products")
print(f"   • Products in both results: {len(common_ids)}")

if common_ids:
    print(f"\n✨ Products found by BOTH image and text search:")
    print("-" * 80)
    for result in image_results:
        if result["id"] in common_ids:
            print(f"   • {result['payload']['title'][:60]}")
            print(
                f"     Brand: {result['payload']['brand']} | Price: ${result['payload']['price']:.2f}"
            )

# Test 4: Category-Filtered Search
print("\n" + "=" * 80)
print("TEST 4: Category-Filtered Search")
print("=" * 80)
print("Demonstrating prefiltering by category...\n")

# Test 4a: Filter by specific category
print('4a. Searching for "comfortable clothing" only in apparel.jeans')
print("-" * 80)

filtered_results = qdrant_service.search(
    query_text="comfortable clothing",
    collection_name="products",
    limit=5,
    filter_conditions={"category": "apparel.jeans"},
)

print(f"✨ Found {len(filtered_results)} jeans:")
for i, result in enumerate(filtered_results, 1):
    print(f"  {i}. {result['payload']['title'][:60]}")
    print(
        f"     Category: {result['payload']['category']} | Price: ${result['payload']['price']:.2f}"
    )

# Test 4b: Filter laptops by category
print('\n4b. Searching for "high performance" only in computers.notebook')
print("-" * 80)

laptop_results = qdrant_service.search(
    query_text="high performance",
    collection_name="products",
    limit=5,
    filter_conditions={"category": "computers.notebook"},
)

print(f"✨ Found {len(laptop_results)} laptops:")
for i, result in enumerate(laptop_results, 1):
    print(f"  {i}. {result['payload']['title'][:60]}")
    print(
        f"     Brand: {result['payload']['brand']} | Price: ${result['payload']['price']:.2f}"
    )

# Test 4c: Image search with category filter
print("\n4c. Image search filtered to apparel.jeans only")
print("-" * 80)

image_filtered = qdrant_service.search(
    query_image=image_path,
    collection_name="products",
    limit=5,
    filter_conditions={"category": "apparel.jeans"},
)

print(f"✨ Found {len(image_filtered)} visually similar jeans:")
for i, result in enumerate(image_filtered, 1):
    print(f"  {i}. {result['payload']['title'][:60]}")
    print(
        f"     Brand: {result['payload']['brand']} | Similarity: {result['score']:.4f}"
    )

# Test 5: Cross-modal search
print("\n" + "=" * 80)
print("TEST 5: Cross-Modal Search")
print("=" * 80)
print("Demonstrating CLIP's multimodal capability...")

cross_modal_queries = ["blue denim clothing", "casual wear", "fashion apparel"]

for query in cross_modal_queries:
    print(f'\n📝 Text query: "{query}"')
    results = qdrant_service.search(
        query_text=query, collection_name="products", limit=3
    )

    if results:
        print(
            f"   Top match: {results[0]['payload']['title'][:50]}... (score: {results[0]['score']:.4f})"
        )

print("\n" + "=" * 80)
print("✅ Multimodal search test completed!")
print("=" * 80)
print("\n💡 Key Insights:")
print("   • CLIP embeddings enable searching images with text and vice versa")
print("   • Image and text searches can find complementary products")
print("   • Cross-modal search works seamlessly in the same vector space")
print("   • Category filtering enables precise product discovery")
print("   • Filters can be combined with both text and image queries")
