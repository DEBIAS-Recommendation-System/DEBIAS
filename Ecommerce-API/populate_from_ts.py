"""
Script to populate the database with products from the TypeScript generated file.
This reads the products.generated.ts file from the frontend and inserts all products into the database.
"""
import json
import re
from pathlib import Path
from typing import Iterable

from sqlalchemy.dialects.postgresql import insert

from app.db.database import SessionLocal
from app.models.models import Product

# Path to the TypeScript file
TS_FILE_PATH = Path(__file__).resolve().parents[1] / "Ecommerce Frontend" / "src" / "data" / "products.generated.ts"
CHUNK_SIZE = 1000


def parse_ts_products(ts_path: Path) -> Iterable[dict]:
    """
    Parse the TypeScript file and extract product data.
    The file contains a products array in JSON-like format.
    """
    with ts_path.open("r", encoding="utf-8") as file:
        content = file.read()
    
    # Find the products array - it starts with "export const products: Product[] = ["
    # and ends with "];"
    match = re.search(r'export const products: Product\[\] = (\[[\s\S]*?\]);', content)
    
    if not match:
        raise ValueError("Could not find products array in TypeScript file")
    
    # Get the array content and parse it as JSON
    array_content = match.group(1)
    
    # The keys are already quoted in this TypeScript file, so we can parse directly
    try:
        products_data = json.loads(array_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse products array as JSON: {e}")
    
    # Convert to the format expected by the database
    for product in products_data:
        if not product.get("product_id"):
            continue
        
        # Convert product_id to integer (it's a string in the TS file)
        try:
            product_id = int(product["product_id"])
        except (ValueError, KeyError):
            print(f"Skipping product with invalid product_id: {product}")
            continue
        
        yield {
            "product_id": product_id,
            "title": product.get("title", "").strip(),
            "brand": product.get("brand", "").strip(),
            "category": product.get("category_code", "").strip(),  # Note: TS uses category_code
            "price": float(product.get("price_dec", 0) or 0),  # Note: TS uses price_dec
            "imgUrl": product.get("imgUrl", "").strip(),
        }


def populate_products_from_ts(ts_path: Path = TS_FILE_PATH) -> None:
    """
    Populate the database with products from the TypeScript file.
    Uses batch inserts for efficiency and ignores conflicts (doesn't update existing products).
    """
    if not ts_path.exists():
        raise FileNotFoundError(f"TypeScript file not found at {ts_path}")
    
    print(f"Reading products from {ts_path}")
    
    total_inserted = 0
    total_processed = 0
    batch: list[dict] = []
    
    with SessionLocal() as db:
        for row in parse_ts_products(ts_path):
            batch.append(row)
            total_processed += 1
            
            if len(batch) >= CHUNK_SIZE:
                stmt = insert(Product).values(batch)
                stmt = stmt.on_conflict_do_nothing(index_elements=["product_id"])
                result = db.execute(stmt)
                db.commit()
                inserted = result.rowcount or 0
                total_inserted += inserted
                print(f"Processed {total_processed} products, inserted {total_inserted} so far...")
                batch.clear()
        
        # Insert remaining products
        if batch:
            stmt = insert(Product).values(batch)
            stmt = stmt.on_conflict_do_nothing(index_elements=["product_id"])
            result = db.execute(stmt)
            db.commit()
            total_inserted += result.rowcount or 0
    
    print(f"\n✓ Complete! Processed {total_processed} products")
    print(f"✓ Inserted {total_inserted} new products into the database")
    print(f"✓ Skipped {total_processed - total_inserted} existing products")


if __name__ == "__main__":
    try:
        populate_products_from_ts()
    except Exception as e:
        print(f"✗ Error: {e}")
        raise
