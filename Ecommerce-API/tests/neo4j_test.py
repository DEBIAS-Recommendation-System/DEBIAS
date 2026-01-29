"""
Neo4j Recommendation Tests
Test collaborative filtering and product similarity queries.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from neo4j import GraphDatabase
from app.core.config import settings

# Neo4j connection settings
NEO4J_URI = f"bolt://{getattr(settings, 'neo4j_hostname', 'localhost')}:7687"
NEO4J_USER = getattr(settings, 'neo4j_user', 'neo4j')
NEO4J_PASSWORD = getattr(settings, 'neo4j_password', 'testing_password')


def get_driver():
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def find_similar_products(product_id: int, limit: int = 10):
    """
    Find products similar to the given product based on collaborative filtering.
    Users who interacted with this product also interacted with these products.
    """
    driver = get_driver()
    
    query = """
    // Find users who interacted with the target product
    MATCH (p1:Product {product_id: $product_id})<-[:INTERACTED]-(u:User)-[:INTERACTED]->(p2:Product)
    WHERE p1 <> p2
    
    // Count how many users interacted with both products
    WITH p2.product_id AS similar_product_id, count(DISTINCT u) AS shared_users
    
    // Order by most shared users
    ORDER BY shared_users DESC
    LIMIT $limit
    
    RETURN similar_product_id, shared_users
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            records = list(result)
            return records
    finally:
        driver.close()


def find_similar_products_by_event_type(product_id: int, event_type: str = "view", limit: int = 10):
    """
    Find similar products based on a specific event type (view, cart, purchase).
    """
    driver = get_driver()
    
    query = """
    MATCH (p1:Product {product_id: $product_id})<-[r1:INTERACTED]-(u:User)-[r2:INTERACTED]->(p2:Product)
    WHERE p1 <> p2 AND r1.event_type = $event_type AND r2.event_type = $event_type
    
    WITH p2.product_id AS similar_product_id, count(DISTINCT u) AS shared_users
    ORDER BY shared_users DESC
    LIMIT $limit
    
    RETURN similar_product_id, shared_users
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, product_id=product_id, event_type=event_type, limit=limit)
            records = list(result)
            return records
    finally:
        driver.close()


def find_products_purchased_together(product_id: int, limit: int = 10):
    """
    Find products frequently purchased together (same session).
    """
    driver = get_driver()
    
    query = """
    MATCH (p1:Product {product_id: $product_id})<-[r1:INTERACTED]-(u:User)-[r2:INTERACTED]->(p2:Product)
    WHERE p1 <> p2 
      AND r1.event_type = 'purchase' 
      AND r2.event_type = 'purchase'
      AND r1.session_id = r2.session_id
    
    WITH p2.product_id AS co_purchased_product_id, count(*) AS purchase_count
    ORDER BY purchase_count DESC
    LIMIT $limit
    
    RETURN co_purchased_product_id, purchase_count
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            records = list(result)
            return records
    finally:
        driver.close()


def get_product_stats(product_id: int):
    """
    Get interaction statistics for a product.
    """
    driver = get_driver()
    
    query = """
    MATCH (p:Product {product_id: $product_id})<-[r:INTERACTED]-(u:User)
    
    WITH p, 
         count(r) AS total_interactions,
         count(DISTINCT u) AS unique_users,
         count(CASE WHEN r.event_type = 'view' THEN 1 END) AS views,
         count(CASE WHEN r.event_type = 'cart' THEN 1 END) AS carts,
         count(CASE WHEN r.event_type = 'purchase' THEN 1 END) AS purchases
    
    RETURN total_interactions, unique_users, views, carts, purchases
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, product_id=product_id)
            record = result.single()
            return record
    finally:
        driver.close()


def check_product_exists(product_id: int):
    """Check if a product exists in Neo4j."""
    driver = get_driver()
    
    query = "MATCH (p:Product {product_id: $product_id}) RETURN p.product_id AS product_id"
    
    try:
        with driver.session() as session:
            result = session.run(query, product_id=product_id)
            record = result.single()
            return record is not None
    finally:
        driver.close()


if __name__ == "__main__":
    TARGET_PRODUCT = 10400013
    
    print(f"\n{'='*60}")
    print(f"Neo4j Recommendation Test for Product ID: {TARGET_PRODUCT}")
    print(f"{'='*60}\n")
    
    # Check if product exists
    exists = check_product_exists(TARGET_PRODUCT)
    print(f"Product {TARGET_PRODUCT} exists in Neo4j: {exists}")
    
    if not exists:
        print("\nProduct not found. Make sure you've run bootstrapNeo4j.py first.")
        print("Trying to find any product that exists...")
        
        driver = get_driver()
        with driver.session() as session:
            result = session.run("MATCH (p:Product) RETURN p.product_id LIMIT 5")
            products = [r["p.product_id"] for r in result]
            print(f"Sample products in database: {products}")
            if products:
                TARGET_PRODUCT = products[0]
                print(f"\nUsing product {TARGET_PRODUCT} instead.\n")
        driver.close()
    
    # Get product stats
    print(f"\n--- Product Statistics ---")
    stats = get_product_stats(TARGET_PRODUCT)
    if stats:
        print(f"Total interactions: {stats['total_interactions']}")
        print(f"Unique users: {stats['unique_users']}")
        print(f"Views: {stats['views']}")
        print(f"Cart adds: {stats['carts']}")
        print(f"Purchases: {stats['purchases']}")
    else:
        print("No interactions found for this product.")
    
    # Find similar products (collaborative filtering)
    print(f"\n--- Similar Products (Collaborative Filtering) ---")
    similar = find_similar_products(TARGET_PRODUCT, limit=10)
    if similar:
        for record in similar:
            print(f"  Product {record['similar_product_id']}: {record['shared_users']} shared users")
    else:
        print("  No similar products found.")
    
    # Find similar by views
    print(f"\n--- Similar Products (By Views) ---")
    similar_views = find_similar_products_by_event_type(TARGET_PRODUCT, "view", limit=10)
    if similar_views:
        for record in similar_views:
            print(f"  Product {record['similar_product_id']}: {record['shared_users']} users also viewed")
    else:
        print("  No similar products found.")
    
    # Find products purchased together
    print(f"\n--- Products Purchased Together ---")
    co_purchased = find_products_purchased_together(TARGET_PRODUCT, limit=10)
    if co_purchased:
        for record in co_purchased:
            print(f"  Product {record['co_purchased_product_id']}: {record['purchase_count']} co-purchases")
    else:
        print("  No co-purchased products found.")
    
    print(f"\n{'='*60}\n")
