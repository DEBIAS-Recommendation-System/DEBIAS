"""
Alternative script to populate products using the API endpoint.
This reads the products.generated.ts file and creates products via the REST API.
Requires an admin account to authenticate.
"""
import json
import re
import os
import requests
from pathlib import Path
from typing import List, Dict
from getpass import getpass

# Configuration
API_BASE_URL = os.getenv("API_URL", "http://localhost:8000")
TS_FILE_PATH = Path(__file__).resolve().parents[1] / "Ecommerce Frontend" / "src" / "data" / "products.generated.ts"
BATCH_SIZE = 100  # Number of products to send in each batch


def parse_ts_products(ts_path: Path) -> List[Dict]:
    """
    Parse the TypeScript file and extract product data.
    """
    with ts_path.open("r", encoding="utf-8") as file:
        content = file.read()
    
    # Find the products array
    match = re.search(r'export const products: Product\[\] = (\[[\s\S]*?\]);', content)
    
    if not match:
        raise ValueError("Could not find products array in TypeScript file")
    
    array_content = match.group(1)
    
    # Fix for JSON parsing - add quotes to property names
    json_content = re.sub(r'(\w+):', r'"\1":', array_content)
    
    try:
        products_data = json.loads(json_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse products array as JSON: {e}")
    
    # Convert to API format
    api_products = []
    for product in products_data:
        if not product.get("product_id"):
            continue
        
        try:
            product_id = int(product["product_id"])
        except (ValueError, KeyError):
            print(f"Skipping product with invalid product_id: {product}")
            continue
        
        api_products.append({
            "product_id": product_id,
            "title": product.get("title", "").strip(),
            "brand": product.get("brand", "").strip(),
            "category": product.get("category_code", "").strip(),
            "price": float(product.get("price_dec", 0) or 0),
            "imgUrl": product.get("imgUrl", "").strip(),
        })
    
    return api_products


def login_admin(base_url: str, username: str, password: str) -> str:
    """
    Login as admin and return the access token.
    """
    login_url = f"{base_url}/auth/login"
    
    response = requests.post(
        login_url,
        data={
            "username": username,
            "password": password,
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Login failed: {response.status_code} - {response.text}")
    
    data = response.json()
    return data["access_token"]


def create_product_via_api(base_url: str, token: str, product: Dict) -> bool:
    """
    Create a single product via the API.
    Returns True if successful, False otherwise.
    """
    create_url = f"{base_url}/products/"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(create_url, json=product, headers=headers)
    
    if response.status_code == 201:
        return True
    elif response.status_code == 409 or "already exists" in response.text.lower():
        # Product already exists, skip
        return False
    else:
        print(f"Failed to create product {product['product_id']}: {response.status_code} - {response.text}")
        return False


def populate_products_via_api(ts_path: Path = TS_FILE_PATH, base_url: str = API_BASE_URL):
    """
    Populate the database with products using the API endpoint.
    """
    if not ts_path.exists():
        raise FileNotFoundError(f"TypeScript file not found at {ts_path}")
    
    # Get admin credentials
    print(f"API Base URL: {base_url}")
    print("\nPlease enter admin credentials:")
    username = input("Username: ")
    password = getpass("Password: ")
    
    print("\nAuthenticating...")
    token = login_admin(base_url, username, password)
    print("✓ Authentication successful")
    
    print(f"\nReading products from {ts_path}")
    products = parse_ts_products(ts_path)
    total_products = len(products)
    print(f"Found {total_products} products to insert")
    
    # Insert products
    inserted = 0
    skipped = 0
    failed = 0
    
    for i, product in enumerate(products, 1):
        if create_product_via_api(base_url, token, product):
            inserted += 1
        else:
            skipped += 1
        
        # Progress update every 100 products
        if i % 100 == 0:
            print(f"Progress: {i}/{total_products} - Inserted: {inserted}, Skipped: {skipped}")
    
    print(f"\n{'='*60}")
    print(f"✓ Complete!")
    print(f"  Total products: {total_products}")
    print(f"  Inserted: {inserted}")
    print(f"  Skipped (already exist): {skipped}")
    print(f"  Failed: {failed}")
    print(f"{'='*60}")


if __name__ == "__main__":
    try:
        populate_products_via_api()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        raise
