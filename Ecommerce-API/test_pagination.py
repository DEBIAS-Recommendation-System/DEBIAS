"""
Quick test to verify pagination is working correctly
"""
from app.services.products import ProductService
from app.db.database import SessionLocal

def test_pagination():
    """Test that the ProductService returns total_count"""
    with SessionLocal() as db:
        result = ProductService.get_all_products(db, page=1, limit=8, search="")
        
        print("API Response Structure:")
        print(f"Keys: {result.keys()}")
        print(f"Message: {result['message']}")
        print(f"Number of products: {len(result['data'])}")
        print(f"Total count: {result.get('total_count', 'NOT FOUND!')}")
        
        if 'total_count' in result:
            print(f"\n✓ SUCCESS: total_count is present in response")
            print(f"  Total products in DB: {result['total_count']}")
            print(f"  Total pages (with limit 8): {result['total_count'] // 8 + (1 if result['total_count'] % 8 else 0)}")
        else:
            print("\n✗ ERROR: total_count is missing from response!")

if __name__ == "__main__":
    test_pagination()
