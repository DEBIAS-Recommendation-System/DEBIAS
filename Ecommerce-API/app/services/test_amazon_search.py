"""
Test search on indexed Amazon products
"""

from app.services.qdrant_service import qdrant_service


def test_text_searches():
    """Test various text search queries"""
    
    print("=" * 70)
    print("TESTING AMAZON PRODUCT SEARCH")
    print("=" * 70)
    
    # Connect
    print("\n🔌 Connecting to Qdrant...")
    qdrant_service.connect()
    
    # Get collection info
    info = qdrant_service.get_collection_info("amazon_products")
    print(f"\n📊 Collection Status:")
    print(f"   Products indexed: {info['points_count']}")
    print(f"   Status: {info['status']}")
    
    # Initialize text model for searching
    print("\n🔍 Loading search model...")
    qdrant_service.initialize_multimodal_models()
    
    # Test queries
    queries = [
        "nike shoes",
        "jeans for women",
        "barbie doll",
        "laptop computer",
        "bluetooth headphones",
        "kitchen appliance",
        "winter jacket",
        "smartphone"
    ]
    
    print("\n" + "=" * 70)
    print("SEARCH TESTS")
    print("=" * 70)
    
    for query in queries:
        print(f"\n🔍 Query: \"{query}\"")
        print("-" * 70)
        
        results = qdrant_service.search(
            query_text=query,
            limit=5,
            collection_name="amazon_products"
        )
        
        if results:
            for i, result in enumerate(results, 1):
                print(f"{i}. {result['payload']['title'][:55]}")
                print(f"   Category: {result['payload']['category']:30s} | Price: ${result['payload']['price']:7.2f} | Score: {result['score']:.4f}")
        else:
            print("   No results found")
    
    print("\n" + "=" * 70)
    print("✅ TESTS COMPLETE!")
    print("=" * 70)


def test_category_filtering():
    """Test search with category filters"""
    
    print("\n" + "=" * 70)
    print("CATEGORY FILTERING TEST")
    print("=" * 70)
    
    # Search for shoes in specific categories
    print("\n🔍 Query: 'shoes' (no filter)")
    results = qdrant_service.search(
        query_text="shoes",
        limit=3,
        collection_name="amazon_products"
    )
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['payload']['title'][:50]} - {result['payload']['category']}")
    
    # With filter
    print("\n🔍 Query: 'shoes' (filtered by category='Men's Shoes')")
    results = qdrant_service.search(
        query_text="shoes",
        limit=3,
        filter_conditions={"category": "Men's Shoes"},
        collection_name="amazon_products"
    )
    
    if results:
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['payload']['title'][:50]} - {result['payload']['category']}")
    else:
        print("   No results with that category filter")


def test_price_range():
    """Test getting products in specific price ranges"""
    
    print("\n" + "=" * 70)
    print("PRICE ANALYSIS")
    print("=" * 70)
    
    # Get some random products
    print("\n🔍 Sample products with prices:")
    results = qdrant_service.search(
        query_text="product",
        limit=10,
        collection_name="amazon_products"
    )
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['payload']['title'][:45]:45s} | ${result['payload']['price']:8.2f}")


def main():
    """Run all tests"""
    
    try:
        test_text_searches()
        test_category_filtering()
        test_price_range()
        
        print("\n🎯 All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
