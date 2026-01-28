#!/usr/bin/env python3
"""
Test script to verify embedding setup is working correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_qdrant_connection():
    """Test connection to Qdrant"""
    print("1. Testing Qdrant connection...")
    try:
        from app.services.qdrant_service import qdrant_service
        qdrant_service.connect()
        print("   ✓ Successfully connected to Qdrant")
        return True
    except Exception as e:
        print(f"   ❌ Failed to connect: {str(e)}")
        return False


def test_csv_file():
    """Test if CSV file exists and is readable"""
    print("\n2. Testing CSV file...")
    csv_path = "/home/adem/Desktop/DEBIAS/data/products.csv"
    
    try:
        if not os.path.exists(csv_path):
            print(f"   ❌ CSV file not found at {csv_path}")
            return False
        
        # Try reading first few lines
        import csv
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            row = next(reader)
            
            required_columns = ['product_id', 'title', 'brand', 'category', 'price', 'imgUrl']
            missing = [col for col in required_columns if col not in row]
            
            if missing:
                print(f"   ❌ Missing columns: {missing}")
                return False
            
            print(f"   ✓ CSV file found and valid")
            print(f"   ✓ Columns: {list(row.keys())}")
            print(f"   ✓ Sample product: {row['title'][:50]}...")
            return True
            
    except Exception as e:
        print(f"   ❌ Error reading CSV: {str(e)}")
        return False


def test_models_loading():
    """Test if CLIP models can be loaded"""
    print("\n3. Testing CLIP model loading...")
    print("   (This may take a moment on first run...)")
    
    try:
        from app.services.qdrant_service import qdrant_service
        qdrant_service.connect()
        
        print("   Loading text model...")
        qdrant_service.initialize_text_embedding_model("Qdrant/clip-ViT-B-32-text")
        print("   ✓ Text model loaded")
        
        print("   Loading image model...")
        qdrant_service.initialize_image_embedding_model("Qdrant/clip-ViT-B-32-vision")
        print("   ✓ Image model loaded")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to load models: {str(e)}")
        return False


def test_embedding_sample():
    """Test embedding a single sample product"""
    print("\n4. Testing sample product embedding...")
    
    try:
        from scripts.embed_products import embed_products
        from app.services.qdrant_service import qdrant_service
        
        csv_path = "/home/adem/Desktop/DEBIAS/data/products.csv"
        test_collection = "test_products"
        
        # Embed just 1 product
        print("   Embedding 1 sample product...")
        success, failed = embed_products(
            csv_path=csv_path,
            collection_name=test_collection,
            limit=1,
            batch_size=1
        )
        
        if success > 0:
            print("   ✓ Sample product embedded successfully")
            
            # Clean up test collection
            try:
                qdrant_service.client.delete_collection(test_collection)
                print("   ✓ Test collection cleaned up")
            except:
                pass
            
            return True
        else:
            print("   ❌ Failed to embed sample product")
            return False
            
    except Exception as e:
        print(f"   ❌ Error during embedding: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("Product Embedding - Setup Verification")
    print("=" * 60)
    print()
    
    results = []
    
    # Run tests
    results.append(("Qdrant Connection", test_qdrant_connection()))
    results.append(("CSV File", test_csv_file()))
    results.append(("CLIP Models", test_models_loading()))
    results.append(("Sample Embedding", test_embedding_sample()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<30} {status}")
    
    all_passed = all(result[1] for result in results)
    
    print()
    if all_passed:
        print("✅ All tests passed! You're ready to embed products.")
        print()
        print("Run the embedding script:")
        print("  cd /home/adem/Desktop/DEBIAS")
        print("  ./start_embedding.sh")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
