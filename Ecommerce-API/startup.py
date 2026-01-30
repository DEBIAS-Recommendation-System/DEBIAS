#!/usr/bin/env python3
"""
Initialize database and Qdrant with product data
This script runs automatically on container startup
"""

import sys
import os
import time
from pathlib import Path

# Ensure app modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def wait_for_services():
    """Wait for database and Qdrant to be ready"""
    import psycopg2
    from app.core.config import settings
    
    max_retries = 30
    retry_interval = 2
    
    # Wait for PostgreSQL
    print("⏳ Waiting for PostgreSQL...")
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=settings.db_hostname,
                port=settings.db_port,
                user=settings.db_username,
                password=settings.db_password,
                database=settings.db_name
            )
            conn.close()
            print("✓ PostgreSQL is ready")
            break
        except Exception as e:
            if i == max_retries - 1:
                print(f"✗ PostgreSQL not ready after {max_retries * retry_interval}s: {e}")
                return False
            time.sleep(retry_interval)
    
    # Wait for Qdrant
    print("⏳ Waiting for Qdrant...")
    for i in range(max_retries):
        try:
            from qdrant_client import QdrantClient
            client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
            client.get_collections()
            print("✓ Qdrant is ready")
            break
        except Exception as e:
            if i == max_retries - 1:
                print(f"✗ Qdrant not ready after {max_retries * retry_interval}s: {e}")
                return False
            time.sleep(retry_interval)
    
    return True


def run_migrations():
    """Run database migrations"""
    print("\n📊 Running database migrations...")
    try:
        from alembic.config import Config
        from alembic import command
        
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("✓ Migrations completed")
        return True
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False


def populate_database():
    """Populate PostgreSQL with products from CSV"""
    print("\n📦 Populating database with products...")
    try:
        from populateDB import populate_products
        populate_products()
        print("✓ Database populated")
        return True
    except Exception as e:
        print(f"✗ Database population failed: {e}")
        return False


def embed_products_to_qdrant():
    """Embed products into Qdrant vector database"""
    print("\n🔄 Embedding products to Qdrant...")
    try:
        from scripts.embed_products import embed_products
        
        csv_path = Path(__file__).resolve().parents[1] / "data" / "products.csv"
        
        # Embed all products (no limit)
        success, failed = embed_products(
            csv_path=str(csv_path),
            collection_name="products",
            limit=None,  # Embed all products
            batch_size=50
        )
        
        print(f"✓ Embedded {success} products (failed: {failed})")
        return True
    except Exception as e:
        print(f"✗ Product embedding failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_if_data_exists():
    """Check if data already exists in database and Qdrant"""
    try:
        from app.db.database import SessionLocal
        from app.models.models import Product
        from qdrant_client import QdrantClient
        from app.core.config import settings
        
        # Check PostgreSQL
        with SessionLocal() as db:
            product_count = db.query(Product).count()
            if product_count > 0:
                print(f"ℹ️  Database already has {product_count} products")
                return True
        
        # Check Qdrant
        client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
        collections = client.get_collections().collections
        if any(col.name == "products" for col in collections):
            info = client.get_collection("products")
            if info.points_count > 0:
                print(f"ℹ️  Qdrant already has {info.points_count} embedded products")
                return True
        
        return False
    except Exception as e:
        print(f"⚠️  Could not check existing data: {e}")
        return False


def main():
    """Main initialization routine"""
    print("=" * 60)
    print("🚀 Initializing E-commerce API Data")
    print("=" * 60)
    
    # Wait for services
    if not wait_for_services():
        print("\n✗ Services not ready. Skipping initialization.")
        sys.exit(1)
    
    # Check if data already exists
    if check_if_data_exists():
        print("\n✓ Data already exists. Skipping initialization.")
        print("=" * 60)
        return
    
    # Run migrations
    if not run_migrations():
        print("\n✗ Initialization failed at migrations stage")
        sys.exit(1)
    
    # Populate database
    if not populate_database():
        print("\n✗ Initialization failed at database population stage")
        sys.exit(1)
    
    # Embed products
    if not embed_products_to_qdrant():
        print("\n⚠️  Product embedding failed, but database is populated")
        print("You can run embedding manually later")
    
    print("\n" + "=" * 60)
    print("✅ Initialization completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Initialization cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n✗ Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
