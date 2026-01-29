"""
Simple image embedding example using local sample images
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import qdrant_service
from PIL import Image, ImageDraw, ImageFont
import os


def create_sample_images():
    """Create simple sample product images for testing"""
    os.makedirs("temp_images", exist_ok=True)

    products = []
    colors = {
        "headphones": ("#4A90E2", "Headphones"),
        "shoes": ("#E94B3C", "Running Shoes"),
        "watch": ("#50C878", "Smart Watch"),
        "speaker": ("#9B59B6", "Speaker"),
        "backpack": ("#F39C12", "Backpack"),
    }

    for idx, (name, (color, label)) in enumerate(colors.items(), 1):
        img = Image.new("RGB", (400, 400), color=color)
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40
            )
        except:
            font = ImageFont.load_default()

        # Center the text
        bbox = draw.textbbox((0, 0), label, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (400 - text_width) // 2
        y = (400 - text_height) // 2

        draw.text((x, y), label, fill="white", font=font)

        # Save image
        filename = f"temp_images/{name}.png"
        img.save(filename)

        products.append(
            {
                "id": idx,
                "name": label,
                "category": label.split()[0] if " " in label else label,
                "image_path": filename,
                "price": 50 + idx * 50,
            }
        )

    return products


def example_local_images():
    """Test image embeddings with local files"""

    print("=" * 70)
    print("Image Embedding Example with Local Files")
    print("=" * 70)

    # Create sample images
    print("\n✓ Creating sample product images...")
    products = create_sample_images()
    print(f"   Created {len(products)} sample images")

    # Connect and initialize
    print("\n✓ Connecting to Qdrant...")
    qdrant_service.connect()

    print("✓ Initializing CLIP image model (this may take a moment)...")
    qdrant_service.initialize_image_embedding_model("Qdrant/clip-ViT-B-32-vision")

    print("✓ Creating collection...")
    qdrant_service.create_collection(collection_name="local_products", vector_size=512)

    # Insert products
    print(f"\n✓ Embedding {len(products)} products...")
    for product in products:
        print(f"   - {product['name']}: {product['image_path']}")
        qdrant_service.insert_point(
            point_id=product["id"],
            image_path=product["image_path"],
            payload={
                "product_name": product["name"],
                "category": product["category"],
                "price": product["price"],
            },
            collection_name="local_products",
        )

    print("\n✓ Products embedded successfully!")

    # Visual search
    print("\n" + "=" * 70)
    print("Visual Similarity Search")
    print("=" * 70)

    query_image = products[0]["image_path"]  # Use first product as query
    print(f"\n🔍 Query image: {products[0]['name']}")

    results = qdrant_service.search(
        query_image=query_image, limit=3, collection_name="local_products"
    )

    print("\nTop 3 Similar Products:")
    print("-" * 70)
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['payload']['product_name']}")
        print(f"   Category: {result['payload']['category']}")
        print(f"   Price: ${result['payload']['price']}")
        print(f"   Similarity: {result['score']:.4f}")
        print()

    # Cross-modality search (text query on image index)
    print("=" * 70)
    print("Cross-Modal Search - Text Query on Image Index")
    print("=" * 70)

    print("\n✓ Initializing CLIP text model...")
    qdrant_service.initialize_text_embedding_model("Qdrant/clip-ViT-B-32-text")

    text_queries = ["electronic audio device", "footwear for sports", "portable bag"]

    for query in text_queries:
        print(f"\n🔍 Text query: '{query}'")
        results = qdrant_service.search(
            query_text=query, limit=2, collection_name="local_products"
        )

        if results:
            print(
                f"   → {results[0]['payload']['product_name']} (score: {results[0]['score']:.4f})"
            )

    print("\n" + "=" * 70)
    print("✅ Demo completed successfully!")
    print("=" * 70)

    # Cleanup
    print("\n✓ Cleaning up temporary images...")
    import shutil

    try:
        shutil.rmtree("temp_images")
    except:
        pass


def example_product_with_description():
    """Example showing how to combine image and text for better search"""

    print("\n" + "=" * 70)
    print("Multimodal Product Search - Image + Text Description")
    print("=" * 70)

    # Create a sample image
    img = Image.new("RGB", (400, 400), color="#2E86AB")
    draw = ImageDraw.Draw(img)
    draw.text((120, 180), "Camera", fill="white")
    img.save("temp_camera.png")

    print("\n✓ Setting up multimodal search...")
    qdrant_service.connect()
    qdrant_service.initialize_multimodal_models(
        text_model="Qdrant/clip-ViT-B-32-text",
        image_model="Qdrant/clip-ViT-B-32-vision",
    )
    qdrant_service.create_collection(collection_name="multimodal_demo", vector_size=512)

    # Product with image and rich description
    product = {
        "id": 1,
        "name": "Professional Camera",
        "description": "High-resolution digital camera with 4K video recording, perfect for photography enthusiasts",
        "image": "temp_camera.png",
    }

    print(f"✓ Inserting product: {product['name']}")
    qdrant_service.insert_point(
        point_id=product["id"],
        image_path=product["image"],
        text=product["description"],
        payload={"product_name": product["name"], "price": 899.99},
        collection_name="multimodal_demo",
    )

    # Search with text
    print("\n🔍 Searching with text: 'photography equipment'")
    results = qdrant_service.search(
        query_text="photography equipment", limit=1, collection_name="multimodal_demo"
    )

    if results:
        print(f"   Found: {results[0]['payload']['product_name']}")
        print(f"   Score: {results[0]['score']:.4f}")

    # Cleanup
    try:
        os.remove("temp_camera.png")
    except:
        pass

    print("\n" + "=" * 70)


if __name__ == "__main__":
    try:
        example_local_images()
        example_product_with_description()

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()
