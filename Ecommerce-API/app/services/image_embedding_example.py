"""
Example usage of Qdrant service with IMAGE embeddings for product search
Demonstrates how to embed product images and search by visual similarity
"""

from app.services.qdrant_service import qdrant_service
import os


def create_sample_product_images():
    """
    Create sample URLs for product images (using placeholder images for demo)
    In production, these would be actual product images
    """
    products = [
        {
            "id": 1,
            "name": "Wireless Headphones",
            "description": "Premium noise-canceling wireless headphones",
            "category": "Electronics",
            "price": 299.99,
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",  # Headphones
        },
        {
            "id": 2,
            "name": "Running Shoes",
            "description": "Comfortable athletic running shoes",
            "category": "Sports",
            "price": 89.99,
            "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",  # Shoes
        },
        {
            "id": 3,
            "name": "Smart Watch",
            "description": "Fitness tracking smartwatch",
            "category": "Electronics",
            "price": 249.99,
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",  # Watch
        },
        {
            "id": 4,
            "name": "Bluetooth Speaker",
            "description": "Portable waterproof speaker",
            "category": "Electronics",
            "price": 79.99,
            "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",  # Speaker
        },
        {
            "id": 5,
            "name": "Backpack",
            "description": "Durable hiking backpack",
            "category": "Outdoor",
            "price": 129.99,
            "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",  # Backpack
        }
    ]
    return products


def example_image_embeddings():
    """Demonstrates image-based product search"""
    
    print("=" * 70)
    print("Qdrant Image Embedding Example - Product Visual Search")
    print("=" * 70)
    
    # 1. Connect to Qdrant
    print("\n✓ Connecting to Qdrant...")
    qdrant_service.connect()
    
    # 2. Initialize image embedding model (CLIP)
    print("✓ Initializing CLIP image embedding model...")
    qdrant_service.initialize_image_embedding_model("Qdrant/clip-ViT-B-32-vision")
    
    # 3. Create collection for images
    print("✓ Creating collection for image embeddings...")
    qdrant_service.create_collection(collection_name="product_images", vector_size=512)
    
    # 4. Get sample products
    products = create_sample_product_images()
    
    # 5. Insert products with image embeddings
    print(f"\n✓ Embedding and inserting {len(products)} products...")
    for product in products:
        print(f"   - Processing: {product['name']}")
        try:
            qdrant_service.insert_point(
                point_id=product["id"],
                image_path=product["image_url"],
                payload={
                    "product_name": product["name"],
                    "description": product["description"],
                    "category": product["category"],
                    "price": product["price"]
                },
                collection_name="product_images"
            )
        except Exception as e:
            print(f"   ⚠ Failed to process {product['name']}: {e}")
    
    print("\n✓ All products embedded successfully!")
    
    # 6. Visual similarity search
    print("\n" + "=" * 70)
    print("Visual Similarity Search - Find Similar Products by Image")
    print("=" * 70)
    
    # Search using an existing product image
    query_image = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"  # Headphones
    print(f"\n🔍 Query: Searching for products similar to headphones image...")
    
    try:
        query_vector = qdrant_service.create_image_embedding(query_image)
        results = qdrant_service.search(
            query_vector=query_vector,
            limit=3,
            collection_name="product_images"
        )
        
        print("\nTop 3 Visually Similar Products:")
        print("-" * 70)
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['payload']['product_name']}")
            print(f"   Category: {result['payload']['category']}")
            print(f"   Price: ${result['payload']['price']}")
            print(f"   Visual Similarity: {result['score']:.4f}")
            print()
    except Exception as e:
        print(f"Search failed: {e}")
    
    print("=" * 70)


def example_multimodal_products():
    """Demonstrates combining text and image for product embeddings"""
    
    print("\n" + "=" * 70)
    print("Multimodal Product Embeddings - Text + Image")
    print("=" * 70)
    
    # Initialize multimodal models
    print("\n✓ Initializing CLIP multimodal models...")
    qdrant_service.initialize_multimodal_models(
        text_model="Qdrant/clip-ViT-B-32-text",
        image_model="Qdrant/clip-ViT-B-32-vision"
    )
    
    # Create collection
    qdrant_service.create_collection(collection_name="multimodal_products", vector_size=512)
    
    # Insert product with both text and image
    print("✓ Inserting multimodal product (text + image)...")
    
    product = {
        "id": 1,
        "name": "Premium Headphones",
        "description": "Wireless noise-canceling over-ear headphones with 30-hour battery",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
    }
    
    try:
        qdrant_service.insert_point(
            point_id=product["id"],
            text=product["description"],
            image_path=product["image_url"],
            payload={
                "product_name": product["name"],
                "category": "Electronics"
            },
            collection_name="multimodal_products"
        )
        print("✓ Multimodal product inserted successfully!")
        
        # Search with text query
        print("\n🔍 Searching with text: 'wireless audio device'...")
        text_vector = qdrant_service.create_text_embedding("wireless audio device")
        results = qdrant_service.search(
            query_vector=text_vector,
            limit=1,
            collection_name="multimodal_products"
        )
        
        if results:
            print(f"   Found: {results[0]['payload']['product_name']}")
            print(f"   Score: {results[0]['score']:.4f}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 70)


def example_batch_image_processing():
    """Demonstrates efficient batch processing of product images"""
    
    print("\n" + "=" * 70)
    print("Batch Image Processing - Efficient Product Embedding")
    print("=" * 70)
    
    # Get products
    products = create_sample_product_images()
    
    # Initialize model
    qdrant_service.connect()
    qdrant_service.initialize_image_embedding_model()
    qdrant_service.create_collection(collection_name="batch_products", vector_size=512)
    
    # Extract all image URLs
    image_urls = [p["image_url"] for p in products]
    
    print(f"\n✓ Batch processing {len(image_urls)} product images...")
    try:
        # Create all embeddings at once (more efficient)
        vectors = qdrant_service.create_image_embeddings_batch(image_urls)
        
        # Prepare batch insert
        points = []
        for i, product in enumerate(products):
            points.append({
                "id": product["id"],
                "vector": vectors[i],
                "payload": {
                    "product_name": product["name"],
                    "category": product["category"],
                    "price": product["price"]
                }
            })
        
        # Insert all at once
        qdrant_service.insert_points_batch(points, collection_name="batch_products")
        
        print(f"✓ Successfully embedded and inserted {len(points)} products!")
        
    except Exception as e:
        print(f"Batch processing failed: {e}")
    
    print("=" * 70)


if __name__ == "__main__":
    try:
        # Example 1: Image-only embeddings
        example_image_embeddings()
        
        # Example 2: Multimodal (text + image)
        example_multimodal_products()
        
        # Example 3: Batch processing
        example_batch_image_processing()
        
        print("\n✅ All examples completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
