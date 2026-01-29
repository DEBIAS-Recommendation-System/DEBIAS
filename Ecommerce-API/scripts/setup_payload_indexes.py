"""
Setup Payload Indexes for E-commerce Optimization

This script creates payload indexes for frequently filtered fields in Qdrant
to optimize filtered vector search performance.

Usage:
    python scripts/setup_payload_indexes.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.qdrant_service import qdrant_service
from app.core.config import settings


def setup_indexes():
    """
    Create payload indexes for e-commerce fields
    """
    print("🔧 Setting up payload indexes for e-commerce optimization...")
    print(f"   Collection: {settings.qdrant_collection_name}")
    print()

    try:
        # Connect to Qdrant
        print("📡 Connecting to Qdrant...")
        qdrant_service.connect()
        print("✅ Connected successfully\n")

        # Check if collection exists
        collections = qdrant_service.client.get_collections().collections
        collection_exists = any(
            col.name == settings.qdrant_collection_name for col in collections
        )

        if not collection_exists:
            print(f"⚠️  Collection '{settings.qdrant_collection_name}' does not exist.")
            print("   Please create the collection first using the embedding scripts.")
            return

        print("📊 Creating payload indexes...")
        print()

        # Create indexes for common e-commerce fields
        qdrant_service.create_payload_indexes(
            collection_name=settings.qdrant_collection_name,
            fields=None,  # Uses defaults: category, brand, price
        )

        print()
        print("✅ Payload indexes created successfully!")
        print()
        print("📈 Performance Benefits:")
        print("   • Faster filtered searches (category, brand, price filters)")
        print("   • Improved HNSW graph connectivity during filtered search")
        print("   • Better query planning and optimization")
        print()
        print("💡 Usage Examples:")
        print("   • Filter by category: filter_conditions={'category': 'Electronics'}")
        print("   • Filter by brand: filter_conditions={'brand': 'Samsung'}")
        print("   • Filter by price range: Use range filters in your API")
        print()

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


def show_collection_info():
    """
    Display information about the collection and its indexes
    """
    try:
        qdrant_service.connect()
        collection_info = qdrant_service.get_collection_info()

        print("📊 Collection Information:")
        print(f"   Name: {collection_info['name']}")
        print(f"   Points: {collection_info['points_count']}")
        print(f"   Vectors: {collection_info['vectors_count']}")
        print(f"   Status: {collection_info['status']}")
        print()

        # Get full collection details to show payload schema
        full_info = qdrant_service.client.get_collection(
            collection_name=settings.qdrant_collection_name
        )

        if hasattr(full_info.config, "params") and hasattr(
            full_info.config.params, "vectors"
        ):
            vectors_config = full_info.config.params.vectors
            if hasattr(vectors_config, "size"):
                print(f"   Vector Size: {vectors_config.size}")
            if hasattr(vectors_config, "distance"):
                print(f"   Distance: {vectors_config.distance}")

        print()

    except Exception as e:
        print(f"❌ Error getting collection info: {str(e)}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Setup payload indexes for e-commerce optimization"
    )
    parser.add_argument(
        "--info",
        action="store_true",
        help="Show collection information",
    )
    parser.add_argument(
        "--custom-fields",
        nargs="+",
        help="Custom fields to index (e.g., --custom-fields category brand price rating)",
    )

    args = parser.parse_args()

    if args.info:
        show_collection_info()
    elif args.custom_fields:
        print(f"🔧 Creating indexes for custom fields: {', '.join(args.custom_fields)}")
        print()
        qdrant_service.connect()
        qdrant_service.create_payload_indexes(
            collection_name=settings.qdrant_collection_name,
            fields=args.custom_fields,
        )
        print()
        print("✅ Custom indexes created successfully!")
    else:
        setup_indexes()
