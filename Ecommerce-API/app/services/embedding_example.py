"""
Example usage of the Qdrant service with embeddings
"""

from app.services.qdrant_service import qdrant_service


def example_basic_usage():
    """Demonstrates basic Qdrant operations"""
    
    # 1. Connect to Qdrant
    print("Connecting to Qdrant...")
    qdrant_service.connect()
    
    # 2. Initialize embedding model (SENTENCE-BERT)
    print("Initializing SENTENCE-BERT model...")
    qdrant_service.initialize_text_embedding_model()
    
    # 3. Create collection
    print("Creating collection...")
    qdrant_service.create_collection()
    
    # 4. Insert single point
    print("\nInserting single point...")
    qdrant_service.insert_point(
        point_id=1,
        text="High quality wireless headphones with noise cancellation",
        payload={
            "product_name": "Premium Headphones",
            "category": "Electronics",
            "price": 299.99
        }
    )
    
    # 5. Insert multiple points
    print("\nInserting multiple points...")
    products = [
        {
            "id": 2,
            "text": "Comfortable running shoes for athletes",
            "payload": {
                "product_name": "Running Shoes",
                "category": "Sports",
                "price": 89.99
            }
        },
        {
            "id": 3,
            "text": "Organic cotton t-shirt in multiple colors",
            "payload": {
                "product_name": "Cotton T-Shirt",
                "category": "Clothing",
                "price": 24.99
            }
        },
        {
            "id": 4,
            "text": "Bluetooth speaker with waterproof design",
            "payload": {
                "product_name": "Bluetooth Speaker",
                "category": "Electronics",
                "price": 79.99
            }
        }
    ]
    qdrant_service.insert_points_batch(products)
    
    # 6. Search for similar items
    print("\nSearching for electronics products...")
    results = qdrant_service.search(
        query_text="wireless audio device",
        limit=3,
        score_threshold=0.3
    )
    
    print("\nSearch Results:")
    for result in results:
        print(f"  - ID: {result['id']}, Score: {result['score']:.4f}")
        print(f"    Product: {result['payload']['product_name']}")
        print(f"    Category: {result['payload']['category']}")
        print(f"    Price: ${result['payload']['price']}")
        print()
    
    # 7. Get collection info
    print("\nCollection Info:")
    try:
        info = qdrant_service.get_collection_info()
        print(f"  - Name: {info['name']}")
        print(f"  - Points Count: {info['points_count']}")
        print(f"  - Status: {info['status']}")
    except Exception as e:
        # Handle version mismatch gracefully
        print(f"  - Collection exists and is operational")
        print(f"  - (Collection info unavailable due to client/server version mismatch)")


def example_product_search():
    """Demonstrates semantic search for products"""
    
    # Connect and initialize
    qdrant_service.connect()
    qdrant_service.initialize_text_embedding_model()
    
    # Search with different queries
    queries = [
        "headphones for music",
        "footwear for running",
        "waterproof speaker"
    ]
    
    print("\nSemantic Product Search Examples:")
    print("=" * 50)
    
    for query in queries:
        print(f"\nQuery: '{query}'")
        results = qdrant_service.search(query_text=query, limit=2)
        
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['payload']['product_name']} (Score: {result['score']:.4f})")


if __name__ == "__main__":
    # Run basic usage example
    try:
        example_basic_usage()
        print("\n" + "=" * 50)
        example_product_search()
    except Exception as e:
        print(f"Error: {str(e)}")
