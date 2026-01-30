import csv
import shutil
from pathlib import Path
from typing import Iterable
from concurrent.futures import ThreadPoolExecutor, as_completed

from neo4j import GraphDatabase

from app.core.config import settings

EVENTS_CSV_PATH = Path(__file__).resolve().parents[1] / "data" / "filtered_2020-Jan_behavior.csv"
CHUNK_SIZE = 5000

# Neo4j connection settings
NEO4J_URI = f"bolt://{getattr(settings, 'neo4j_hostname', 'localhost')}:7687"
NEO4J_USER = getattr(settings, 'neo4j_user', 'neo4j')
NEO4J_PASSWORD = getattr(settings, 'neo4j_password', 'testing_password')


def _read_event_rows(path: Path) -> Iterable[dict]:
    """Read user behavior events from CSV."""
    with path.open("r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not row.get("product_id") or not row.get("user_id"):
                continue
            yield {
                "event_time": row.get("event_time", "").strip(),
                "event_type": row.get("event_type", "").strip(),
                "product_id": int(row["product_id"]),
                "user_id": int(row["user_id"]),
                "user_session": row.get("user_session", "").strip(),
            }


def create_constraints(driver) -> None:
    """Create uniqueness constraints and indexes for user behavior tracking."""
    with driver.session() as session:
        # Unique constraint on User.user_id
        session.run("""
            CREATE CONSTRAINT user_id_unique IF NOT EXISTS
            FOR (u:User) REQUIRE u.user_id IS UNIQUE
        """)
        # Unique constraint on Product.product_id (reference only, data in Postgres)
        session.run("""
            CREATE CONSTRAINT product_id_unique IF NOT EXISTS
            FOR (p:Product) REQUIRE p.product_id IS UNIQUE
        """)
        # Index on Session.session_id
        session.run("""
            CREATE CONSTRAINT session_id_unique IF NOT EXISTS
            FOR (s:Session) REQUIRE s.session_id IS UNIQUE
        """)
        # Index on event_type for faster queries
        session.run("""
            CREATE INDEX event_type_index IF NOT EXISTS
            FOR ()-[r:INTERACTED]-() ON (r.event_type)
        """)
    print("Constraints and indexes created.")


def populate_user_behavior(csv_path: Path = EVENTS_CSV_PATH) -> None:
    """Populate Neo4j with user behavior events for recommendations using bulk insert."""
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found at {csv_path}")

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    try:
        # Verify connectivity
        driver.verify_connectivity()
        print(f"Connected to Neo4j at {NEO4J_URI}")

        # Create constraints first
        create_constraints(driver)

        # Phase 1: Bulk create Users and Products first (faster with separate queries)
        print("Phase 1: Creating User and Product nodes...")
        _bulk_create_nodes(driver, csv_path)

        # Phase 2: Bulk create relationships
        print("Phase 2: Creating relationships...")
        total_inserted = _bulk_create_relationships(driver, csv_path)

        print(f"Inserted {total_inserted} user behavior events from {csv_path}")

    finally:
        driver.close()


def _bulk_create_nodes(driver, csv_path: Path) -> None:
    """Bulk create User and Product nodes separately for better performance."""
    users = set()
    products = set()
    sessions = set()

    # Collect unique IDs
    for row in _read_event_rows(csv_path):
        users.add(row["user_id"])
        products.add(row["product_id"])
        sessions.add(row["user_session"])

    print(f"  Found {len(users)} unique users, {len(products)} unique products, {len(sessions)} unique sessions")

    with driver.session() as session:
        # Bulk insert users
        user_batches = list(_chunked(list(users), CHUNK_SIZE))
        for i, batch in enumerate(user_batches):
            session.run(
                "UNWIND $ids AS id MERGE (u:User {user_id: id})",
                ids=batch
            )
            print(f"  Users: batch {i+1}/{len(user_batches)}")

        # Bulk insert products
        product_batches = list(_chunked(list(products), CHUNK_SIZE))
        for i, batch in enumerate(product_batches):
            session.run(
                "UNWIND $ids AS id MERGE (p:Product {product_id: id})",
                ids=batch
            )
            print(f"  Products: batch {i+1}/{len(product_batches)}")

        # Bulk insert sessions
        session_batches = list(_chunked(list(sessions), CHUNK_SIZE))
        for i, batch in enumerate(session_batches):
            session.run(
                "UNWIND $ids AS id MERGE (s:Session {session_id: id})",
                ids=batch
            )
            print(f"  Sessions: batch {i+1}/{len(session_batches)}")


def _bulk_create_relationships(driver, csv_path: Path) -> int:
    """Bulk create relationships using optimized queries."""
    total_inserted = 0
    batch: list[dict] = []

    with driver.session() as session:
        for row in _read_event_rows(csv_path):
            batch.append(row)
            if len(batch) >= CHUNK_SIZE:
                total_inserted += _insert_event_batch_optimized(session, batch)
                print(f"  Processed {total_inserted} events...")
                batch.clear()

        if batch:
            total_inserted += _insert_event_batch_optimized(session, batch)

    return total_inserted


def _insert_event_batch_optimized(session, batch: list[dict]) -> int:
    """Optimized batch insert - nodes already exist, just create relationships."""
    query = """
    UNWIND $events AS event
    
    MATCH (u:User {user_id: event.user_id})
    MATCH (p:Product {product_id: event.product_id})
    MATCH (s:Session {session_id: event.user_session})
    
    MERGE (u)-[:HAS_SESSION]->(s)
    
    CREATE (u)-[r:INTERACTED {
        event_type: event.event_type,
        event_time: event.event_time,
        session_id: event.user_session
    }]->(p)
    
    RETURN count(r) AS count
    """
    result = session.run(query, events=batch)
    record = result.single()
    return record["count"] if record else 0


def _chunked(iterable, size):
    """Yield successive chunks from iterable."""
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]


def clear_database(driver) -> None:
    """Optional: Clear all nodes and relationships."""
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
    print("Database cleared.")


def get_driver():
    """Get a Neo4j driver instance."""
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


if __name__ == "__main__":
    populate_user_behavior()