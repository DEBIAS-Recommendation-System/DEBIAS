"""
Neo4j Graph Database Service
Handles connection to Neo4j and behavioral recommendation operations
"""

from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import logging

from neo4j import GraphDatabase, Driver
from neo4j.exceptions import ServiceUnavailable, AuthError

from app.core.config import settings

logger = logging.getLogger(__name__)


class Neo4jService:
    """
    Service class for managing Neo4j graph database operations.
    Provides behavioral recommendations based on user interactions.
    """

    def __init__(self):
        """Initialize Neo4j service"""
        self.driver: Optional[Driver] = None
        self.uri = f"bolt://{settings.neo4j_hostname}:{settings.neo4j_port}"
        self.user = settings.neo4j_user
        self.password = settings.neo4j_password

    def connect(self) -> bool:
        """Establish connection to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info(f"Connected to Neo4j at {self.uri}")
            return True
        except AuthError as e:
            logger.error(f"Neo4j authentication failed: {str(e)}")
            raise
        except ServiceUnavailable as e:
            logger.error(f"Neo4j service unavailable: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {str(e)}")
            raise

    def disconnect(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
            logger.info("Disconnected from Neo4j")

    @contextmanager
    def session(self):
        """Context manager for Neo4j sessions"""
        if not self.driver:
            self.connect()
        session = self.driver.session()
        try:
            yield session
        finally:
            session.close()

    # =========================================================================
    # USER BEHAVIOR TRACKING
    # =========================================================================

    def record_interaction(
        self,
        user_id: int,
        product_id: int,
        event_type: str,
        session_id: Optional[str] = None,
        event_time: Optional[str] = None
    ) -> bool:
        """
        Record a user interaction with a product.
        
        Args:
            user_id: The user's ID
            product_id: The product's ID
            event_type: Type of interaction (view, cart, purchase)
            session_id: Optional session identifier
            event_time: Optional timestamp
            
        Returns:
            True if successful
        """
        query = """
        MERGE (u:User {user_id: $user_id})
        MERGE (p:Product {product_id: $product_id})
        CREATE (u)-[r:INTERACTED {
            event_type: $event_type,
            event_time: $event_time,
            session_id: $session_id
        }]->(p)
        RETURN r
        """
        
        with self.session() as session:
            result = session.run(
                query,
                user_id=user_id,
                product_id=product_id,
                event_type=event_type,
                event_time=event_time,
                session_id=session_id
            )
            return result.single() is not None

    def record_batch_interactions(
        self,
        interactions: List[Dict[str, Any]]
    ) -> int:
        """
        Record multiple interactions in a single transaction.
        
        Args:
            interactions: List of dicts with user_id, product_id, event_type, etc.
            
        Returns:
            Number of interactions recorded
        """
        query = """
        UNWIND $interactions AS i
        MERGE (u:User {user_id: i.user_id})
        MERGE (p:Product {product_id: i.product_id})
        CREATE (u)-[r:INTERACTED {
            event_type: i.event_type,
            event_time: i.event_time,
            session_id: i.session_id
        }]->(p)
        RETURN count(r) AS count
        """
        
        with self.session() as session:
            result = session.run(query, interactions=interactions)
            record = result.single()
            return record["count"] if record else 0

    # =========================================================================
    # COLLABORATIVE FILTERING RECOMMENDATIONS
    # =========================================================================

    def get_collaborative_recommendations(
        self,
        user_id: int,
        limit: int = 10,
        min_shared_products: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Get recommendations based on collaborative filtering.
        "Users who liked what you liked also liked these products"
        
        Args:
            user_id: The user to get recommendations for
            limit: Maximum number of recommendations
            min_shared_products: Minimum products in common with similar users
            
        Returns:
            List of recommended products with scores
        """
        query = """
        // Find products the user has interacted with
        MATCH (me:User {user_id: $user_id})-[:INTERACTED]->(my_products:Product)
        
        // Find similar users who interacted with the same products
        MATCH (my_products)<-[:INTERACTED]-(similar:User)
        WHERE similar.user_id <> $user_id
        
        // Count shared products per similar user
        WITH me, similar, count(DISTINCT my_products) AS shared_count
        WHERE shared_count >= $min_shared
        
        // Find products those similar users liked that I haven't seen
        MATCH (similar)-[r:INTERACTED]->(rec:Product)
        WHERE NOT (me)-[:INTERACTED]->(rec)
        
        // Score by weighted interaction type and number of similar users
        WITH rec.product_id AS product_id,
             count(DISTINCT similar) AS recommender_count,
             sum(CASE 
                 WHEN r.event_type = 'purchase' THEN 80
                 WHEN r.event_type = 'cart' THEN 30
                 WHEN r.event_type = 'view' THEN 1
                 ELSE 0 
             END) AS interaction_score
        
        RETURN product_id,
               recommender_count,
               interaction_score,
               (recommender_count * 10 + interaction_score) AS total_score
        ORDER BY total_score DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(
                query,
                user_id=user_id,
                limit=limit,
                min_shared=min_shared_products
            )
            return [dict(record) for record in result]

    def get_similar_users(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find users with similar behavior patterns.
        
        Args:
            user_id: The user to find similar users for
            limit: Maximum number of similar users
            
        Returns:
            List of similar users with similarity scores
        """
        query = """
        MATCH (me:User {user_id: $user_id})-[:INTERACTED]->(p:Product)<-[:INTERACTED]-(other:User)
        WHERE other.user_id <> $user_id
        
        WITH other, count(DISTINCT p) AS shared_products
        
        // Get total products each user has interacted with
        MATCH (me:User {user_id: $user_id})-[:INTERACTED]->(my_p:Product)
        WITH other, shared_products, count(DISTINCT my_p) AS my_total
        
        MATCH (other)-[:INTERACTED]->(other_p:Product)
        WITH other, shared_products, my_total, count(DISTINCT other_p) AS other_total
        
        // Jaccard similarity
        WITH other,
             shared_products,
             toFloat(shared_products) / (my_total + other_total - shared_products) AS similarity
        
        RETURN other.user_id AS user_id,
               shared_products,
               similarity
        ORDER BY similarity DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, user_id=user_id, limit=limit)
            return [dict(record) for record in result]

    # =========================================================================
    # PRODUCT-BASED RECOMMENDATIONS
    # =========================================================================

    def get_similar_products(
        self,
        product_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find products similar based on user behavior.
        "Users who viewed this also viewed..."
        
        Args:
            product_id: The product to find similar products for
            limit: Maximum number of similar products
            
        Returns:
            List of similar products with co-occurrence scores
        """
        query = """
        MATCH (p:Product {product_id: $product_id})<-[:INTERACTED]-(u:User)-[r:INTERACTED]->(other:Product)
        WHERE other.product_id <> $product_id
        
        WITH other.product_id AS product_id,
             count(DISTINCT u) AS shared_users,
             sum(CASE 
                 WHEN r.event_type = 'purchase' THEN 80
                 WHEN r.event_type = 'cart' THEN 30
                 WHEN r.event_type = 'view' THEN 1
                 ELSE 1 
             END) AS interaction_score
        
        RETURN product_id,
               shared_users,
               interaction_score
        ORDER BY shared_users DESC, interaction_score DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            return [dict(record) for record in result]

    def get_frequently_bought_together(
        self,
        product_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find products frequently purchased together.
        
        Args:
            product_id: The product to find companions for
            limit: Maximum number of products
            
        Returns:
            List of products with co-purchase frequency
        """
        query = """
        MATCH (p:Product {product_id: $product_id})<-[r1:INTERACTED]-(u:User)-[r2:INTERACTED]->(other:Product)
        WHERE other.product_id <> $product_id
          AND r1.event_type = 'purchase'
          AND r2.event_type = 'purchase'
          AND r1.session_id = r2.session_id
        
        WITH other.product_id AS product_id,
             count(*) AS co_purchase_count
        
        RETURN product_id, co_purchase_count
        ORDER BY co_purchase_count DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            return [dict(record) for record in result]

    def get_also_viewed(
        self,
        product_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find products also viewed in the same session.
        
        Args:
            product_id: The product to find session companions for
            limit: Maximum number of products
            
        Returns:
            List of products viewed in same sessions
        """
        query = """
        MATCH (p:Product {product_id: $product_id})<-[r1:INTERACTED]-(u:User)-[r2:INTERACTED]->(other:Product)
        WHERE other.product_id <> $product_id
          AND r1.event_type = 'view'
          AND r2.event_type = 'view'
          AND r1.session_id = r2.session_id
        
        WITH other.product_id AS product_id,
             count(DISTINCT u) AS user_count,
             count(*) AS view_count
        
        RETURN product_id, user_count, view_count
        ORDER BY user_count DESC, view_count DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            return [dict(record) for record in result]

    # =========================================================================
    # POPULARITY & TRENDING
    # =========================================================================

    def get_trending_products(
        self,
        limit: int = 10,
        event_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get trending/popular products based on recent interactions.
        
        Args:
            limit: Maximum number of products
            event_types: Filter by event types (default: all)
            
        Returns:
            List of trending products with interaction counts
        """
        if event_types:
            query = """
            MATCH (u:User)-[r:INTERACTED]->(p:Product)
            WHERE r.event_type IN $event_types
            
            WITH p.product_id AS product_id,
                 count(r) AS total_interactions,
                 count(DISTINCT u) AS unique_users
            
            RETURN product_id, total_interactions, unique_users
            ORDER BY total_interactions DESC
            LIMIT $limit
            """
            params = {"limit": limit, "event_types": event_types}
        else:
            query = """
            MATCH (u:User)-[r:INTERACTED]->(p:Product)
            
            WITH p.product_id AS product_id,
                 count(r) AS total_interactions,
                 count(DISTINCT u) AS unique_users,
                 sum(CASE WHEN r.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchases,
                 sum(CASE WHEN r.event_type = 'cart' THEN 1 ELSE 0 END) AS carts,
                 sum(CASE WHEN r.event_type = 'view' THEN 1 ELSE 0 END) AS views
            
            RETURN product_id, total_interactions, unique_users, purchases, carts, views
            ORDER BY total_interactions DESC
            LIMIT $limit
            """
            params = {"limit": limit}
        
        with self.session() as session:
            result = session.run(query, **params)
            return [dict(record) for record in result]

    def get_product_stats(
        self,
        product_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get interaction statistics for a specific product.
        
        Args:
            product_id: The product ID
            
        Returns:
            Dictionary with product statistics
        """
        query = """
        MATCH (p:Product {product_id: $product_id})
        OPTIONAL MATCH (u:User)-[r:INTERACTED]->(p)
        
        WITH p,
             count(r) AS total_interactions,
             count(DISTINCT u) AS unique_users,
             sum(CASE WHEN r.event_type = 'view' THEN 1 ELSE 0 END) AS views,
             sum(CASE WHEN r.event_type = 'cart' THEN 1 ELSE 0 END) AS carts,
             sum(CASE WHEN r.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchases
        
        RETURN p.product_id AS product_id,
               total_interactions,
               unique_users,
               views,
               carts,
               purchases,
               CASE WHEN views > 0 
                    THEN toFloat(purchases) / views 
                    ELSE 0 
               END AS conversion_rate
        """
        
        with self.session() as session:
            result = session.run(query, product_id=product_id)
            record = result.single()
            return dict(record) if record else None

    def get_user_history(
        self,
        user_id: int,
        limit: int = 50,
        event_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get a user's interaction history.
        
        Args:
            user_id: The user ID
            limit: Maximum number of interactions
            event_types: Filter by event types
            
        Returns:
            List of user's interactions
        """
        if event_types:
            query = """
            MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->(p:Product)
            WHERE r.event_type IN $event_types
            
            RETURN p.product_id AS product_id,
                   r.event_type AS event_type,
                   r.event_time AS event_time,
                   r.session_id AS session_id
            ORDER BY r.event_time DESC
            LIMIT $limit
            """
            params = {"user_id": user_id, "limit": limit, "event_types": event_types}
        else:
            query = """
            MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->(p:Product)
            
            RETURN p.product_id AS product_id,
                   r.event_type AS event_type,
                   r.event_time AS event_time,
                   r.session_id AS session_id
            ORDER BY r.event_time DESC
            LIMIT $limit
            """
            params = {"user_id": user_id, "limit": limit}
        
        with self.session() as session:
            result = session.run(query, **params)
            return [dict(record) for record in result]

    def get_recent_viewed_products(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get the user's most recently viewed products (excluding purchases).
        Used for "based on your recent activity" recommendations.
        
        Args:
            user_id: The user ID
            limit: Maximum number of products
            
        Returns:
            List of recently viewed products with timestamps
        """
        query = """
        MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->(p:Product)
        WHERE r.event_type IN ['view', 'cart']
        
        WITH p, r, max(r.event_time) AS last_interaction
        ORDER BY last_interaction DESC
        
        RETURN DISTINCT p.product_id AS product_id,
               r.event_type AS event_type,
               last_interaction AS event_time
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, user_id=user_id, limit=limit)
            return [dict(record) for record in result]

    def has_recent_purchase(
        self,
        user_id: int,
        lookback_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Check if user has made a recent purchase (within lookback period).
        Used to switch recommendation strategy post-purchase.
        
        Args:
            user_id: The user ID
            lookback_hours: Hours to look back for purchases
            
        Returns:
            Dict with has_purchase flag and last purchased product info
        """
        query = """
        MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->(p:Product)
        WHERE r.event_type = 'purchase'
        
        WITH p, r
        ORDER BY r.event_time DESC
        LIMIT 1
        
        RETURN p.product_id AS product_id,
               r.event_time AS event_time,
               r.session_id AS session_id
        """
        
        with self.session() as session:
            result = session.run(query, user_id=user_id)
            record = result.single()
            
            if record:
                return {
                    "has_purchase": True,
                    "last_purchased_product_id": record["product_id"],
                    "purchase_time": record["event_time"],
                    "session_id": record["session_id"]
                }
            return {"has_purchase": False}

    def get_complementary_products(
        self,
        product_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get products that complement a purchased product.
        "Users who bought this also bought..." - for post-purchase recommendations.
        
        This differs from frequently_bought_together by looking at purchases
        made AFTER the initial product, indicating complementary items.
        
        Args:
            product_id: The purchased product ID
            limit: Maximum number of products
            
        Returns:
            List of complementary products with scores
        """
        query = """
        // Find users who purchased this product
        MATCH (p:Product {product_id: $product_id})<-[r1:INTERACTED]-(u:User)
        WHERE r1.event_type = 'purchase'
        
        // Find what else they purchased (not in the same session = complementary)
        MATCH (u)-[r2:INTERACTED]->(other:Product)
        WHERE other.product_id <> $product_id
          AND r2.event_type = 'purchase'
          AND (r2.session_id IS NULL OR r1.session_id IS NULL OR r2.session_id <> r1.session_id)
        
        WITH other.product_id AS product_id,
             count(DISTINCT u) AS buyer_count,
             count(r2) AS purchase_count
        
        RETURN product_id,
               buyer_count,
               purchase_count,
               (buyer_count * 2 + purchase_count) AS score
        ORDER BY score DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, product_id=product_id, limit=limit)
            return [dict(record) for record in result]

    def get_category_trending(
        self,
        category: str,
        limit: int = 10,
        event_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get trending products within a specific category.
        Requires products to have category metadata in Neo4j.
        
        Args:
            category: Category to filter by
            limit: Maximum number of products
            event_types: Filter by event types
            
        Returns:
            List of trending products in category
        """
        if event_types:
            query = """
            MATCH (u:User)-[r:INTERACTED]->(p:Product)
            WHERE p.category = $category
              AND r.event_type IN $event_types
            
            WITH p.product_id AS product_id,
                 count(r) AS total_interactions,
                 count(DISTINCT u) AS unique_users
            
            RETURN product_id, total_interactions, unique_users
            ORDER BY total_interactions DESC
            LIMIT $limit
            """
            params = {"category": category, "limit": limit, "event_types": event_types}
        else:
            query = """
            MATCH (u:User)-[r:INTERACTED]->(p:Product)
            WHERE p.category = $category
            
            WITH p.product_id AS product_id,
                 count(r) AS total_interactions,
                 count(DISTINCT u) AS unique_users
            
            RETURN product_id, total_interactions, unique_users
            ORDER BY total_interactions DESC
            LIMIT $limit
            """
            params = {"category": category, "limit": limit}
        
        with self.session() as session:
            result = session.run(query, **params)
            return [dict(record) for record in result]

    def get_user_purchase_history(
        self,
        user_id: int,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get the user's purchase history.
        
        Args:
            user_id: The user ID
            limit: Maximum number of purchases
            
        Returns:
            List of purchased products
        """
        query = """
        MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->(p:Product)
        WHERE r.event_type = 'purchase'
        
        RETURN p.product_id AS product_id,
               r.event_time AS event_time,
               r.session_id AS session_id
        ORDER BY r.event_time DESC
        LIMIT $limit
        """
        
        with self.session() as session:
            result = session.run(query, user_id=user_id, limit=limit)
            return [dict(record) for record in result]

    # =========================================================================
    # RE-RANKING SUPPORT (for use with semantic search results)
    # =========================================================================

    def rerank_by_popularity(
        self,
        product_ids: List[int],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Re-rank a list of product IDs by popularity.
        Use this to re-rank semantic search results.
        
        Args:
            product_ids: List of product IDs to rank
            limit: Optional limit on results
            
        Returns:
            Products with popularity scores, sorted by score
        """
        query = """
        UNWIND $product_ids AS pid
        MATCH (p:Product {product_id: pid})
        OPTIONAL MATCH (u:User)-[r:INTERACTED]->(p)
        
        WITH pid,
             count(r) AS total_interactions,
             sum(CASE 
                 WHEN r.event_type = 'purchase' THEN 80
                 WHEN r.event_type = 'cart' THEN 30
                 WHEN r.event_type = 'view' THEN 1
                 ELSE 0 
             END) AS weighted_score
        
        RETURN pid AS product_id,
               total_interactions,
               weighted_score
        ORDER BY weighted_score DESC
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        with self.session() as session:
            result = session.run(query, product_ids=product_ids)
            return [dict(record) for record in result]

    def rerank_for_user(
        self,
        product_ids: List[int],
        user_id: int,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Re-rank product IDs personalized for a specific user.
        Boosts products that similar users have liked.
        
        Args:
            product_ids: List of product IDs to rank
            user_id: User to personalize for
            limit: Optional limit on results
            
        Returns:
            Products with personalized scores
        """
        query = """
        // Find products the user has interacted with
        MATCH (me:User {user_id: $user_id})-[:INTERACTED]->(my_products:Product)
        
        // Find similar users
        MATCH (my_products)<-[:INTERACTED]-(similar:User)
        WHERE similar.user_id <> $user_id
        
        // Score candidate products by similar users' interactions
        WITH collect(DISTINCT similar) AS similar_users
        
        UNWIND $product_ids AS pid
        MATCH (p:Product {product_id: pid})
        OPTIONAL MATCH (su)-[r:INTERACTED]->(p)
        WHERE su IN similar_users
        
        WITH pid,
             count(DISTINCT su) AS similar_user_count,
             sum(CASE 
                 WHEN r.event_type = 'purchase' THEN 80
                 WHEN r.event_type = 'cart' THEN 30
                 WHEN r.event_type = 'view' THEN 1
                 ELSE 0 
             END) AS affinity_score
        
        RETURN pid AS product_id,
               similar_user_count,
               affinity_score
        ORDER BY affinity_score DESC
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        with self.session() as session:
            result = session.run(query, product_ids=product_ids, user_id=user_id)
            return [dict(record) for record in result]

    # =========================================================================
    # UTILITY METHODS
    # =========================================================================

    def check_connection(self) -> bool:
        """Check if Neo4j connection is alive"""
        try:
            if self.driver:
                self.driver.verify_connectivity()
                return True
            return False
        except Exception:
            return False

    def get_stats(self) -> Dict[str, int]:
        """Get database statistics"""
        query = """
        MATCH (u:User) WITH count(u) AS user_count
        MATCH (p:Product) WITH user_count, count(p) AS product_count
        MATCH ()-[r:INTERACTED]->() WITH user_count, product_count, count(r) AS interaction_count
        RETURN user_count, product_count, interaction_count
        """
        
        with self.session() as session:
            result = session.run(query)
            record = result.single()
            if record:
                return {
                    "users": record["user_count"],
                    "products": record["product_count"],
                    "interactions": record["interaction_count"]
                }
            return {"users": 0, "products": 0, "interactions": 0}


# Singleton instance
_neo4j_service: Optional[Neo4jService] = None


def get_neo4j_service() -> Neo4jService:
    """Get or create the Neo4j service singleton"""
    global _neo4j_service
    if _neo4j_service is None:
        _neo4j_service = Neo4jService()
        _neo4j_service.connect()
    return _neo4j_service
