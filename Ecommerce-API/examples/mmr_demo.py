#!/usr/bin/env python3
"""
MMR (Maximal Marginal Relevance) Demo
Shows the difference between regular search and MMR-enabled search
"""

import requests
import json


def print_results(title, results):
    """Pretty print search results"""
    print(f"\n{title}")
    print("=" * 80)
    for i, rec in enumerate(results, 1):
        print(f"{i}. {rec['title'][:65]}")
        print(
            f"   Brand: {rec.get('brand', 'N/A'):15} | Price: ${rec.get('price', 0):8.2f} | Score: {rec['score']:.4f}"
        )
    print()


def compare_searches(query, limit=6):
    """Compare regular search vs MMR search"""
    print(f"\n{'=' * 80}")
    print(f"QUERY: '{query}'")
    print(f"{'=' * 80}")

    # Regular search
    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={"query_text": query, "limit": limit},
    )
    regular = response.json()

    # MMR search with moderate diversity
    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={
            "query_text": query,
            "limit": limit,
            "use_mmr": True,
            "mmr_diversity": 0.7,
        },
    )
    mmr_moderate = response.json()

    # MMR search with high diversity
    response = requests.post(
        "http://localhost:8000/recommendations/",
        json={
            "query_text": query,
            "limit": limit,
            "use_mmr": True,
            "mmr_diversity": 0.9,
        },
    )
    mmr_high = response.json()

    # Print results
    print_results("🔍 REGULAR SEARCH (No MMR)", regular["recommendations"])

    print_results(
        "🎯 MMR with MODERATE diversity (0.7)", mmr_moderate["recommendations"]
    )

    print_results("🌈 MMR with HIGH diversity (0.9)", mmr_high["recommendations"])

    # Analysis
    brands_regular = {r["brand"] for r in regular["recommendations"] if r.get("brand")}
    brands_mmr_mod = {
        r["brand"] for r in mmr_moderate["recommendations"] if r.get("brand")
    }
    brands_mmr_high = {
        r["brand"] for r in mmr_high["recommendations"] if r.get("brand")
    }

    print("📊 DIVERSITY ANALYSIS")
    print("-" * 80)
    print(f"Regular search:         {len(brands_regular)} different brands")
    print(f"MMR (diversity=0.7):    {len(brands_mmr_mod)} different brands")
    print(f"MMR (diversity=0.9):    {len(brands_mmr_high)} different brands")
    print()


def main():
    print("\n" + "🚀" * 40)
    print("  MMR (MAXIMAL MARGINAL RELEVANCE) DEMONSTRATION")
    print("🚀" * 40)
    print()
    print("MMR helps reduce redundancy and increase diversity in search results.")
    print("Higher diversity values (0.0-1.0) prioritize variety over pure similarity.")

    # Test different queries
    compare_searches("laptop computer", limit=5)
    compare_searches("nike shoes", limit=5)

    print("\n" + "=" * 80)
    print("✅ Demo complete!")
    print("=" * 80)
    print()
    print("KEY INSIGHTS:")
    print("  • Regular search: Returns most similar items (may be redundant)")
    print("  • MMR low diversity (0.3): Slight variety, still very relevant")
    print("  • MMR moderate (0.7): Good balance of relevance and diversity")
    print("  • MMR high (0.9): Maximum variety (may sacrifice some relevance)")
    print()
    print("USE CASES:")
    print("  • E-commerce: Show variety of products, not just slight variations")
    print("  • Content recommendations: Diverse topics rather than duplicates")
    print("  • Search results: Balance between relevance and exploration")
    print()


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to API at http://localhost:8000")
        print("Make sure the API is running!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
