"""
Index real Amazon products with images and text from CSV
Supports both text search and image search
"""

import csv
import os
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service
from PIL import Image
import requests
from io import BytesIO
import time


def load_products(csv_path, limit=None):
    """Load unique products from CSV file (deduplicates by product_id)"""
    products_dict = {}  # Use dict to automatically deduplicate by product_id

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            product_id = int(row["product_id"])

            # Skip if we already have this product
            if product_id in products_dict:
                continue

            products_dict[product_id] = {
                "id": product_id,
                "title": row["title"],
                "image_url": row["imgUrl"],
                "price": float(row["price_amz"]) if row["price_amz"] else 0,
                "category": row["amazon_category_name"],
                "brand": row["brand"],
                "description": row["txt_amz_final"]
                if row["txt_amz_final"]
                else row["title"],
            }

            # Stop if we reached the limit
            if limit and len(products_dict) >= limit:
                break

    return list(products_dict.values())


def download_image(url, save_path, timeout=10):
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            # Convert to RGB if necessary
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(save_path)
            return True
    except Exception as e:
        print(f"   ⚠️  Failed to download: {str(e)[:50]}")
    return False


def index_products_with_images(csv_path, limit=100, collection_name="amazon_products"):
    """Index products with both text and image embeddings"""

    print("=" * 70)
    print("AMAZON PRODUCTS INDEXER")
    print("=" * 70)

    # Load products
    print(f"\n📂 Loading unique products from CSV...")
    products = load_products(csv_path, limit=limit)
    print(f"   Loaded {len(products)} unique products (deduplicated by product_id)")

    # Setup
    print("\n🔌 Connecting to Qdrant...")
    qdrant_service.connect()

    print("🎨 Loading CLIP multimodal models...")
    qdrant_service.initialize_multimodal_models()

    print(f"📦 Creating collection '{collection_name}'...")
    qdrant_service.create_collection(collection_name, vector_size=512)

    # Create temp directory for images
    os.makedirs("temp_product_images", exist_ok=True)

    # Index products
    print(f"\n🔄 Indexing {len(products)} products...")
    success_count = 0
    fail_count = 0

    for i, product in enumerate(products, 1):
        try:
            print(f"\n[{i}/{len(products)}] {product['title'][:50]}...")

            # Download image
            image_path = f"temp_product_images/{product['id']}.jpg"
            print(f"   📥 Downloading image...")

            if download_image(product["image_url"], image_path):
                # Index with both text and image
                print(f"   🔍 Creating embeddings...")
                qdrant_service.insert_point(
                    point_id=product["id"],
                    text=product["description"],
                    image_path=image_path,
                    payload={
                        "title": product["title"],
                        "price": product["price"],
                        "category": product["category"],
                        "brand": product["brand"],
                        "image_url": product["image_url"],
                    },
                    collection_name=collection_name,
                )
                success_count += 1
                print(f"   ✅ Success")

                # Cleanup image
                os.remove(image_path)
            else:
                fail_count += 1
                print(f"   ❌ Skipped (image download failed)")

            # Rate limiting
            if i % 10 == 0:
                print(f"\n   📊 Progress: {success_count} indexed, {fail_count} failed")
                time.sleep(1)

        except Exception as e:
            fail_count += 1
            print(f"   ❌ Error: {str(e)[:100]}")

    # Cleanup
    try:
        os.rmdir("temp_product_images")
    except:
        pass

    print("\n" + "=" * 70)
    print("✅ INDEXING COMPLETE!")
    print("=" * 70)
    print(f"   Successfully indexed: {success_count}")
    print(f"   Failed: {fail_count}")
    print(f"   Total: {len(products)}")

    return success_count


def search_products(
    query_text=None, query_image_url=None, collection_name="amazon_products", limit=5
):
    """Search products by text or image"""

    print("\n" + "=" * 70)
    print("PRODUCT SEARCH")
    print("=" * 70)

    if query_text:
        print(f'\n🔍 Text Search: "{query_text}"')
        results = qdrant_service.search(
            query_text=query_text, limit=limit, collection_name=collection_name
        )
    elif query_image_url:
        print(f"\n🔍 Image Search: {query_image_url[:60]}...")
        # Download query image
        temp_image = "temp_query_image.jpg"
        if download_image(query_image_url, temp_image):
            results = qdrant_service.search(
                query_image=temp_image, limit=limit, collection_name=collection_name
            )
            os.remove(temp_image)
        else:
            print("   ❌ Failed to download query image")
            return
    else:
        print("   ❌ No query provided")
        return

    print(f"\n   Found {len(results)} results:")
    print()
    for i, result in enumerate(results, 1):
        print(f"   {i}. {result['payload']['title'][:60]}")
        print(f"      Category: {result['payload']['category']}")
        print(f"      Brand: {result['payload']['brand']}")
        print(f"      Price: ${result['payload']['price']:.2f}")
        print(f"      Score: {result['score']:.4f}")
        print(f"      Image: {result['payload']['image_url'][:60]}...")
        print()


def demo_searches(collection_name="amazon_products"):
    """Run demo searches"""

    print("\n" + "=" * 70)
    print("DEMO SEARCHES")
    print("=" * 70)

    # Text searches
    queries = ["women's jeans", "bluetooth headphones", "running shoes", "laptop bag"]

    for query in queries:
        search_products(query_text=query, collection_name=collection_name, limit=3)
        time.sleep(1)


def main():
    """Main execution"""

    csv_path = "/home/adem/Desktop/DEBIAS/Ecommerce-API/final_amazon_dec_joined.csv"
    collection_name = "amazon_products"

    # Index ALL unique products
    print("\n🚀 Indexing ALL unique products from Amazon dataset...")
    print("   (Deduplicating by product_id - December purchase history)")
    print()

    success_count = index_products_with_images(
        csv_path=csv_path,
        limit=None,  # No limit - index everything
        collection_name=collection_name,
    )

    if success_count > 0:
        print("\n" + "=" * 70)
        print("🎯 Ready to search!")
        print("=" * 70)

        # Run demo searches
        demo_searches(collection_name)

        print("\n" + "=" * 70)
        print("✅ ALL DONE!")
        print("=" * 70)
        print("\n💡 To search:")
        print(
            "   • search_products(query_text='your search', collection_name='amazon_products')"
        )
        print(
            "   • search_products(query_image_url='image_url', collection_name='amazon_products')"
        )
    else:
        print("\n❌ No products were indexed successfully")


if __name__ == "__main__":
    main()
