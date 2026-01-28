#!/usr/bin/env python3
"""
Quick runner script to embed products from /data/products.csv
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from embed_products import embed_products, demo_search

if __name__ == "__main__":
    csv_path = "/home/adem/Desktop/DEBIAS/data/products.csv"
    collection_name = "products"

    print("🚀 Product Embedding Script")
    print("=" * 60)
    print(f"CSV: {csv_path}")
    print(f"Collection: {collection_name}")
    print()

    # Get user input for limit
    try:
        print("Options:")
        print("  1. Embed first 100 products (quick test)")
        print("  2. Embed first 500 products")
        print("  3. Embed first 1000 products")
        print("  4. Embed ALL products (~6449)")
        print()

        choice = input("Choose option (1-4) or press Enter for option 1: ").strip()

        limits = {"1": 100, "2": 500, "3": 1000, "4": None}
        limit = limits.get(choice, 100)

        if limit:
            print(f"\n✓ Will embed {limit} products")
        else:
            print(f"\n✓ Will embed ALL products")

    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)

    # Run embedding
    success, failed = embed_products(
        csv_path=csv_path, collection_name=collection_name, limit=limit, batch_size=10
    )

    if success > 0:
        print("\n" + "=" * 60)
        print("Would you like to run demo searches? (y/n)")
        run_demo = input().strip().lower()

        if run_demo == "y":
            demo_search(collection_name=collection_name)
