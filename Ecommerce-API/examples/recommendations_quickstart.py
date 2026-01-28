#!/usr/bin/env python3
"""
Quick Start: Recommendations API
Simple examples to get you started with the recommendations endpoint
"""

import requests
import json


def example_1_simple_text_search():
    """Example 1: Basic text search"""
    print("\n" + "=" * 60)
    print("Example 1: Simple Text Search")
    print("=" * 60)

    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={"query_text": "laptop", "limit": 3},
    )

    data = response.json()
    print(f"\nQuery Type: {data['query_type']}")
    print(f"Found {data['total_results']} recommendations:\n")

    for i, rec in enumerate(data["recommendations"], 1):
        print(f"{i}. {rec['title']}")
        print(f"   Score: {rec['score']:.3f} | Price: ${rec.get('price', 0):.2f}\n")


def example_2_filtered_search():
    """Example 2: Search with category filter"""
    print("\n" + "=" * 60)
    print("Example 2: Filtered Search")
    print("=" * 60)

    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={
            "query_text": "comfortable shoes",
            "limit": 5,
            "filters": {"category": "Sports & Outdoors"},
        },
    )

    data = response.json()
    print(f"\nFilters: {data['filters_applied']}")
    print(f"Found {data['total_results']} recommendations in Sports & Outdoors:\n")

    for i, rec in enumerate(data["recommendations"], 1):
        print(f"{i}. {rec['title'][:50]}")
        print(f"   Brand: {rec.get('brand', 'N/A')} | Score: {rec['score']:.3f}\n")


def example_3_threshold_search():
    """Example 3: Search with similarity threshold"""
    print("\n" + "=" * 60)
    print("Example 3: Search with Similarity Threshold")
    print("=" * 60)

    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={
            "query_text": "wireless headphones",
            "limit": 10,
            "score_threshold": 0.75,  # Only high-quality matches
        },
    )

    data = response.json()
    print(f"\nMinimum score threshold: 0.75")
    print(f"Found {data['total_results']} high-quality matches:\n")

    for i, rec in enumerate(data["recommendations"], 1):
        print(f"{i}. {rec['title'][:50]}")
        print(f"   Score: {rec['score']:.3f} (✓ Above threshold)\n")


def example_4_health_check():
    """Example 4: Check service health"""
    print("\n" + "=" * 60)
    print("Example 4: Health Check")
    print("=" * 60)

    response = requests.get("http://localhost:8000/recommendations/health")
    data = response.json()

    print(f"\nService Status: {data['status']}")
    print(f"Text Model Ready: {'✓' if data['text_model_ready'] else '✗'}")
    print(f"Image Model Ready: {'✓' if data['image_model_ready'] else '✗'}")
    print(f"Indexed Products: {data.get('indexed_products', 'Unknown')}")


def main():
    """Run all examples"""
    print("\n" + "🚀" * 30)
    print("  RECOMMENDATIONS API - QUICK START EXAMPLES")
    print("🚀" * 30)

    try:
        # Check if API is running
        response = requests.get(
            "http://localhost:8000/recommendations/health", timeout=2
        )
        if response.status_code != 200:
            print("\n❌ API is not responding correctly.")
            print("Make sure the API is running: python run.py")
            return
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to API at http://localhost:8000")
        print("Make sure the API is running: python run.py")
        return

    try:
        example_4_health_check()
        example_1_simple_text_search()
        example_2_filtered_search()
        example_3_threshold_search()

        print("\n" + "=" * 60)
        print("✅ All examples completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("  • Try your own queries with different text")
        print("  • Experiment with filters (category, brand, etc.)")
        print("  • Adjust score_threshold to control result quality")
        print("  • See RECOMMENDATIONS_API.md for full documentation")
        print()

    except Exception as e:
        print(f"\n❌ Error running examples: {str(e)}")
        print("Check that:")
        print("  1. API is running (python run.py)")
        print("  2. Qdrant is running and accessible")
        print("  3. Products are indexed in Qdrant")


if __name__ == "__main__":
    main()
