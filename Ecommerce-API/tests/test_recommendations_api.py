"""
Test the Recommendations API Endpoint
This script demonstrates how to use the recommendations endpoint
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_recommendations(response_data):
    """Pretty print recommendation results"""
    print(f"\n✨ Query Type: {response_data['query_type']}")
    print(f"📊 Total Results: {response_data['total_results']}")
    
    if response_data.get('filters_applied'):
        print(f"🔍 Filters Applied: {json.dumps(response_data['filters_applied'], indent=2)}")
    
    print("\n" + "-" * 80)
    print("Recommendations:")
    print("-" * 80)
    
    for i, rec in enumerate(response_data['recommendations'], 1):
        print(f"\n{i}. {rec['title']}")
        print(f"   Brand: {rec.get('brand', 'N/A')}")
        print(f"   Category: {rec.get('category', 'N/A')}")
        print(f"   Price: ${rec.get('price', 0):.2f}")
        print(f"   Similarity Score: {rec['score']:.4f}")
        if rec.get('image_url'):
            print(f"   Image: {rec['image_url'][:60]}...")


def test_health_check():
    """Test the health check endpoint"""
    print_section("Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/recommendations/health")
        response.raise_for_status()
        
        data = response.json()
        print(f"\n✅ Status: {data['status']}")
        print(f"📝 Message: {data['message']}")
        print(f"🤖 Text Model Ready: {data['text_model_ready']}")
        print(f"🖼️  Image Model Ready: {data['image_model_ready']}")
        print(f"📦 Collection: {data['collection']}")
        print(f"📊 Indexed Products: {data.get('indexed_products', 'Unknown')}")
        
        return data['status'] == 'healthy'
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False


def test_text_search():
    """Test text-based recommendations"""
    print_section("Test 1: Text-Based Recommendations")
    
    payload = {
        "query_text": "comfortable running shoes",
        "limit": 5,
        "score_threshold": 0.5
    }
    
    print(f"\n📝 Request:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/recommendations/",
            json=payload
        )
        response.raise_for_status()
        
        data = response.json()
        print_recommendations(data)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")


def test_text_search_with_filters():
    """Test text search with category filter"""
    print_section("Test 2: Text Search with Category Filter")
    
    payload = {
        "query_text": "laptop computer",
        "limit": 5,
        "filters": {
            "category": "Electronics"
        }
    }
    
    print(f"\n📝 Request:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/recommendations/",
            json=payload
        )
        response.raise_for_status()
        
        data = response.json()
        print_recommendations(data)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")


def test_image_search():
    """Test image-based recommendations"""
    print_section("Test 3: Image-Based Recommendations")
    
    # You would need a valid image URL or path here
    payload = {
        "query_image": "https://example.com/sample-product.jpg",
        "limit": 5
    }
    
    print(f"\n📝 Request:")
    print(json.dumps(payload, indent=2))
    print("\n⚠️  Note: This requires a valid image URL. Update the test with a real image URL.")
    
    # Commented out to avoid errors with invalid URL
    # try:
    #     response = requests.post(
    #         f"{BASE_URL}/recommendations/",
    #         json=payload
    #     )
    #     response.raise_for_status()
    #     
    #     data = response.json()
    #     print_recommendations(data)
    #     
    # except Exception as e:
    #     print(f"❌ Error: {str(e)}")
    #     if hasattr(e, 'response') and e.response is not None:
    #         print(f"Response: {e.response.text}")


def test_multimodal_search():
    """Test combined text + image search"""
    print_section("Test 4: Multimodal Search (Text + Image)")
    
    payload = {
        "query_text": "blue dress",
        "query_image": "https://example.com/blue-dress.jpg",
        "limit": 5,
        "score_threshold": 0.6
    }
    
    print(f"\n📝 Request:")
    print(json.dumps(payload, indent=2))
    print("\n⚠️  Note: This requires a valid image URL. Update the test with a real image URL.")


def test_error_handling():
    """Test error handling with no query"""
    print_section("Test 5: Error Handling (No Query)")
    
    payload = {
        "limit": 5
    }
    
    print(f"\n📝 Request:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/recommendations/",
            json=payload
        )
        
        if response.status_code == 400:
            print(f"\n✅ Expected error received (400 Bad Request):")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def main():
    """Run all tests"""
    print("\n" + "🚀" * 40)
    print("  Recommendations API Test Suite")
    print("🚀" * 40)
    
    # Check if service is healthy
    if not test_health_check():
        print("\n⚠️  Warning: Service is not healthy. Some tests may fail.")
    
    # Run tests
    test_text_search()
    test_text_search_with_filters()
    test_image_search()
    test_multimodal_search()
    test_error_handling()
    
    print("\n" + "=" * 80)
    print("✅ Test suite completed!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
