"""
Embed products from /data/products.csv with their images
Creates multimodal embeddings for text and visual search
"""

import csv
import os
import sys
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service
from PIL import Image
import requests
from io import BytesIO
import time


def load_products_from_csv(csv_path, limit=None):
    """Load products from the simplified CSV format"""
    products = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                product = {
                    "id": int(row["product_id"]),
                    "title": row["title"],
                    "brand": row["brand"],
                    "category": row["category"],
                    "price": float(row["price"]),
                    "image_url": row["imgUrl"],
                }
                products.append(product)

                if limit and len(products) >= limit:
                    break

            except (ValueError, KeyError) as e:
                print(f"⚠️  Skipping invalid row: {e}")
                continue

    return products


def download_product_image(url, save_path, timeout=10):
    """Download and save product image from URL"""
    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )

        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            # Convert to RGB if necessary
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(save_path, "JPEG", quality=85)
            return True
    except Exception as e:
        print(f"      ⚠️  Image download failed: {str(e)[:50]}")
    return False


def embed_products(csv_path, collection_name="products", limit=None, batch_size=10):
    """
    Embed products with multimodal (text + image) embeddings

    Args:
        csv_path: Path to products.csv
        collection_name: Qdrant collection name
        limit: Maximum number of products to embed (None for all)
        batch_size: Number of products to process before pausing
    """

    print("=" * 80)
    print("PRODUCT EMBEDDING - Text + Image Multimodal Search")
    print("=" * 80)

    # Load products
    print(f"\n📂 Loading products from CSV...")
    products = load_products_from_csv(csv_path, limit=limit)
    print(f"   ✓ Loaded {len(products)} products")

    # Connect to Qdrant
    print("\n🔌 Connecting to Qdrant...")
    qdrant_service.connect()

    # Initialize CLIP multimodal models
    print("🎨 Initializing CLIP multimodal models (text + vision)...")
    print("   This may take a moment to download models...")
    qdrant_service.initialize_multimodal_models(
        text_model="Qdrant/clip-ViT-B-32-text",
        image_model="Qdrant/clip-ViT-B-32-vision",
    )

    # Create collection
    print(f"📦 Creating Qdrant collection '{collection_name}'...")
    qdrant_service.create_collection(
        collection_name=collection_name,
        vector_size=512,  # CLIP uses 512 dimensions
    )

    # Create temp directory for images
    temp_dir = "temp_product_images"
    os.makedirs(temp_dir, exist_ok=True)

    # Embed products
    print(f"\n🔄 Embedding {len(products)} products...")
    print("-" * 80)

    success_count = 0
    fail_count = 0

    for i, product in enumerate(products, 1):
        try:
            # Display progress
            title_display = (
                product["title"][:60] + "..."
                if len(product["title"]) > 60
                else product["title"]
            )
            print(f"\n[{i}/{len(products)}] {title_display}")
            print(
                f"   Brand: {product['brand']} | Category: {product['category']} | ${product['price']:.2f}"
            )

            # Download image
            image_path = os.path.join(temp_dir, f"{product['id']}.jpg")
            print(f"   📥 Downloading image...")

            if download_product_image(product["image_url"], image_path):
                # Create text description for better semantic search
                text_description = (
                    f"{product['title']} {product['brand']} {product['category']}"
                )

                # Insert with both text and image embeddings
                print(f"   🔍 Creating embeddings...")
                qdrant_service.insert_point(
                    point_id=product["id"],
                    text=text_description,
                    image_path=image_path,
                    payload={
                        "title": product["title"],
                        "brand": product["brand"],
                        "category": product["category"],
                        "price": product["price"],
                        "image_url": product["image_url"],
                    },
                    collection_name=collection_name,
                )

                success_count += 1
                print(f"   ✅ Embedded successfully")

                # Cleanup image file
                try:
                    os.remove(image_path)
                except:
                    pass
            else:
                fail_count += 1
                print(f"   ❌ Skipped (image unavailable)")

            # Pause after each batch to avoid rate limiting
            if i % batch_size == 0:
                print(
                    f"\n   📊 Progress: {success_count} embedded, {fail_count} failed"
                )
                time.sleep(1)  # Brief pause

        except Exception as e:
            fail_count += 1
            print(f"   ❌ Error: {str(e)[:100]}")

    # Cleanup temp directory
    try:
        os.rmdir(temp_dir)
    except:
        pass

    # Summary
    print("\n" + "=" * 80)
    print("✅ EMBEDDING COMPLETE!")
    print("=" * 80)
    print(f"   Successfully embedded: {success_count} products")
    print(f"   Failed: {fail_count} products")
    print(f"   Total processed: {len(products)} products")
    print(f"   Collection: '{collection_name}'")

    return success_count, fail_count


def search_products(
    query_text=None, query_image_url=None, collection_name="products", limit=5
):
    """
    Search products by text or image

    Args:
        query_text: Text query (e.g., "blue jeans for women")
        query_image_url: Image URL to search visually similar products
        collection_name: Qdrant collection name
        limit: Number of results to return
    """

    print("\n" + "=" * 80)
    print("PRODUCT SEARCH")
    print("=" * 80)

    try:
        if query_text:
            print(f'\n🔍 Text Search: "{query_text}"')
            results = qdrant_service.search(
                query_text=query_text, limit=limit, collection_name=collection_name
            )

        elif query_image_url:
            print(f"\n🖼️  Image Search: {query_image_url[:60]}...")
            # Download query image temporarily
            temp_image = "temp_query_image.jpg"
            if download_product_image(query_image_url, temp_image):
                results = qdrant_service.search(
                    query_image=temp_image, limit=limit, collection_name=collection_name
                )
                os.remove(temp_image)
            else:
                print("   ❌ Failed to download query image")
                return []
        else:
            print("   ❌ No query provided (need query_text or query_image_url)")
            return []

        # Display results
        print(f"\n   Found {len(results)} results:")
        print("-" * 80)

        for i, result in enumerate(results, 1):
            print(f"\n   {i}. {result['payload']['title']}")
            print(f"      Brand: {result['payload']['brand']}")
            print(f"      Category: {result['payload']['category']}")
            print(f"      Price: ${result['payload']['price']:.2f}")
            print(f"      Similarity Score: {result['score']:.4f}")
            print(f"      Image: {result['payload']['image_url'][:70]}...")

        return results

    except Exception as e:
        print(f"   ❌ Search failed: {str(e)}")
        return []


def demo_search(collection_name="products"):
    """Run demo searches to test the embeddings"""

    print("\n" + "=" * 80)
    print("DEMO SEARCHES")
    print("=" * 80)

    # Text-based searches
    text_queries = [
        "women's jeans",
        "sewing machine",
        "laptop computer",
        "notebook lenovo",
    ]

    for query in text_queries:
        search_products(query_text=query, collection_name=collection_name, limit=3)
        time.sleep(1)

    print("\n" + "=" * 80)
    print("✅ Demo complete!")
    print("=" * 80)


def main():
    """Main execution"""

    # Path to the CSV file
    csv_path = "/home/adem/Desktop/DEBIAS/data/products.csv"
    collection_name = "products"

    # Check if CSV exists
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at {csv_path}")
        sys.exit(1)

    print("\n🚀 Starting Product Embedding Process")
    print(f"   CSV: {csv_path}")
    print(f"   Collection: {collection_name}")
    print()

    # Ask user for limit
    try:
        limit_input = input(
            "How many products to embed? (press Enter for ALL): "
        ).strip()
        limit = int(limit_input) if limit_input else None
    except ValueError:
        limit = None

    # Embed products
    success, failed = embed_products(
        csv_path=csv_path, collection_name=collection_name, limit=limit, batch_size=10
    )

    if success > 0:
        # Run demo searches
        print("\n" + "=" * 80)
        print("🎯 Running demo searches...")
        print("=" * 80)

        demo_search(collection_name=collection_name)

        print("\n" + "=" * 80)
        print("✅ ALL DONE!")
        print("=" * 80)
        print("\n💡 Usage examples:")
        print("   from app.services.embed_products import search_products")
        print("   ")
        print("   # Text search")
        print("   search_products(query_text='blue jeans', collection_name='products')")
        print("   ")
        print("   # Image search")
        print(
            "   search_products(query_image_url='https://...jpg', collection_name='products')"
        )
    else:
        print("\n❌ No products were embedded successfully")


if __name__ == "__main__":
    main()
