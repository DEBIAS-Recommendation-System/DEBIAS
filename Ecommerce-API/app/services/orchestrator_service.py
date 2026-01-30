"""
Orchestrator Service
Combines multiple recommendation sources into personalized, intelligent recommendations.

Strategy:
- Pre-purchase (browsing): Uses semantic search with high MMR for diversity to help users explore
- Post-purchase: Switches to Neo4j behavioral predictions for complementary products
- Always includes: Trending items, user-specific behavioral recommendations
"""

from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import logging

from app.services.neo4j_service import Neo4jService, get_neo4j_service
from app.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)


class RecommendationMode(str, Enum):
    """Recommendation mode based on user state"""
    BROWSING = "browsing"  # User is exploring - use semantic search with diversity
    POST_PURCHASE = "post_purchase"  # User just bought something - suggest complementary items
    COLD_START = "cold_start"  # New user - rely on trending and popular items


class RecommendationSource(str, Enum):
    """Source of recommendations for transparency"""
    BEHAVIORAL = "behavioral"  # Neo4j collaborative filtering
    TRENDING = "trending"  # Popular/trending items from Neo4j
    SEMANTIC_SIMILAR = "semantic_similar"  # Qdrant similar to recent activity
    COMPLEMENTARY = "complementary"  # Neo4j post-purchase suggestions
    HYBRID = "hybrid"  # Combined from multiple sources


class OrchestratorService:
    """
    Orchestrator that intelligently combines recommendation sources:
    
    1. User-specific behavioral recommendations (Neo4j)
    2. Trending items (Neo4j)
    3. Based on recent activity - semantically similar products (Qdrant + Neo4j)
    
    Switching Logic:
    - While browsing: High MMR diversity in semantic search to explore options
    - After purchase: Switch to Neo4j complementary product predictions
    """
    
    def __init__(
        self,
        neo4j_service: Optional[Neo4jService] = None,
        qdrant_service: Optional[QdrantService] = None
    ):
        """Initialize with optional pre-existing service instances"""
        self._neo4j_service = neo4j_service
        self._qdrant_service = qdrant_service
    
    @property
    def neo4j(self) -> Neo4jService:
        """Lazy initialization of Neo4j service"""
        if self._neo4j_service is None:
            self._neo4j_service = get_neo4j_service()
        return self._neo4j_service
    
    @property
    def qdrant(self) -> QdrantService:
        """Lazy initialization of Qdrant service"""
        if self._qdrant_service is None:
            from app.services.qdrant_service import qdrant_service
            self._qdrant_service = qdrant_service
            # Ensure connected and initialized
            if self._qdrant_service.client is None:
                self._qdrant_service.connect()
            if self._qdrant_service.text_embedding_model is None:
                self._qdrant_service.initialize_multimodal_models()
        return self._qdrant_service
    
    def enrich_recommendations_with_payload(
        self,
        recommendations: List[Dict[str, Any]],
        collection_name: str = "products"
    ) -> List[Dict[str, Any]]:
        """
        Enrich recommendations with product payload data from Qdrant.
        
        Args:
            recommendations: List of recommendations with product_id
            collection_name: Qdrant collection name
            
        Returns:
            Recommendations with payload data added
        """
        if not recommendations:
            return recommendations
            
        try:
            # Get all product IDs that need enrichment
            product_ids = [r["product_id"] for r in recommendations if not r.get("payload")]
            
            if not product_ids:
                return recommendations
                
            # Batch retrieve product data from Qdrant
            points = self.qdrant.client.retrieve(
                collection_name=collection_name,
                ids=product_ids,
                with_payload=True,
                with_vectors=False
            )
            
            # Create a lookup map
            payload_map = {point.id: point.payload for point in points}
            
            # Enrich recommendations
            for rec in recommendations:
                if not rec.get("payload") and rec["product_id"] in payload_map:
                    rec["payload"] = payload_map[rec["product_id"]]
                    
            logger.info(f"Enriched {len(payload_map)} recommendations with product data")
            return recommendations
            
        except Exception as e:
            logger.warning(f"Error enriching recommendations with payload: {e}")
            return recommendations
    
    def determine_user_mode(
        self,
        user_id: int,
        lookback_hours: int = 24
    ) -> Tuple[RecommendationMode, Optional[Dict[str, Any]]]:
        """
        Determine the recommendation mode for a user based on their recent activity.
        
        Args:
            user_id: User ID
            lookback_hours: Hours to consider for recent purchase
            
        Returns:
            Tuple of (mode, context_data)
        """
        try:
            # Check for recent purchases
            purchase_info = self.neo4j.has_recent_purchase(user_id, lookback_hours)
            
            if purchase_info.get("has_purchase"):
                return RecommendationMode.POST_PURCHASE, purchase_info
            
            # Check if user has any interaction history
            history = self.neo4j.get_user_history(user_id, limit=5)
            
            if not history:
                return RecommendationMode.COLD_START, None
            
            return RecommendationMode.BROWSING, {"recent_interactions": len(history)}
            
        except Exception as e:
            logger.warning(f"Error determining user mode: {e}. Falling back to cold start.")
            return RecommendationMode.COLD_START, None
    
    def get_behavioral_recommendations(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get user-specific behavioral recommendations from Neo4j.
        "Users like you also liked..."
        
        Args:
            user_id: User ID
            limit: Max recommendations
            
        Returns:
            List of product recommendations with metadata
        """
        try:
            results = self.neo4j.get_collaborative_recommendations(
                user_id=user_id,
                limit=limit,
                min_shared_products=1
            )
            
            return [
                {
                    "product_id": r["product_id"],
                    "score": r.get("total_score", 0),
                    "source": RecommendationSource.BEHAVIORAL,
                    "reason": f"Based on {r.get('recommender_count', 0)} similar users"
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting behavioral recommendations: {e}")
            return []
    
    def get_trending_items(
        self,
        limit: int = 10,
        event_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get trending/popular products from Neo4j.
        
        Args:
            limit: Max recommendations
            event_types: Optional filter (e.g., ['purchase'] for bestsellers)
            
        Returns:
            List of trending products
        """
        try:
            results = self.neo4j.get_trending_products(
                limit=limit,
                event_types=event_types
            )
            
            return [
                {
                    "product_id": r["product_id"],
                    "score": r.get("total_interactions", 0),
                    "source": RecommendationSource.TRENDING,
                    "reason": f"Popular with {r.get('unique_users', 0)} users"
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting trending items: {e}")
            return []
    
    def get_similar_to_recent_activity(
        self,
        user_id: int,
        limit: int = 10,
        use_mmr: bool = True,
        mmr_diversity: float = 0.7,
        exclude_product_ids: Optional[List[int]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get products semantically similar to user's recent activity.
        Neo4j provides recent items, Qdrant finds similar products.
        
        Uses high MMR diversity while browsing to help users explore options.
        
        Args:
            user_id: User ID
            limit: Max recommendations
            use_mmr: Enable MMR for diversity
            mmr_diversity: Diversity parameter (0=relevance, 1=diversity)
            exclude_product_ids: Products to exclude (e.g., already purchased)
            
        Returns:
            List of semantically similar products
        """
        try:
            # Get recent viewed products from Neo4j
            recent_products = self.neo4j.get_recent_viewed_products(user_id, limit=5)
            
            if not recent_products:
                logger.info(f"No recent activity for user {user_id}")
                return []
            
            # Get product details from Qdrant to create search query
            product_ids = [p["product_id"] for p in recent_products]
            
            # Fetch product details from Qdrant for embedding
            all_results = []
            seen_ids = set(exclude_product_ids or [])
            seen_ids.update(product_ids)  # Don't recommend products they've already seen
            
            # Search for similar products based on each recent product
            for product_id in product_ids[:3]:  # Use top 3 recent products
                try:
                    # Retrieve the product point from Qdrant
                    points = self.qdrant.client.retrieve(
                        collection_name="products",
                        ids=[product_id],
                        with_vectors=True
                    )
                    
                    if not points:
                        continue
                    
                    # Use the product's vector to find similar products
                    vector = points[0].vector
                    
                    results = self.qdrant.search(
                        query_vector=vector,
                        limit=limit,
                        collection_name="products",
                        use_mmr=use_mmr,
                        mmr_diversity=mmr_diversity,
                        mmr_candidates=limit * 10
                    )
                    
                    for r in results:
                        pid = r["id"]
                        if pid not in seen_ids:
                            seen_ids.add(pid)
                            all_results.append({
                                "product_id": pid,
                                "score": r["score"],
                                "source": RecommendationSource.SEMANTIC_SIMILAR,
                                "reason": "Similar to recently viewed item",
                                "payload": r.get("payload", {})
                            })
                            
                except Exception as e:
                    logger.warning(f"Error searching similar to product {product_id}: {e}")
                    continue
            
            # Sort by score and limit
            all_results.sort(key=lambda x: x["score"], reverse=True)
            return all_results[:limit]
            
        except Exception as e:
            logger.error(f"Error getting similar to recent activity: {e}")
            return []
    
    def get_complementary_products(
        self,
        purchased_product_id: int,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get complementary products after a purchase.
        "Users who bought X also bought Y" - for post-purchase mode.
        
        Args:
            purchased_product_id: The product that was purchased
            user_id: User ID (to exclude already purchased items)
            limit: Max recommendations
            
        Returns:
            List of complementary products
        """
        try:
            # Get user's purchase history to exclude
            purchase_history = self.neo4j.get_user_purchase_history(user_id, limit=50)
            exclude_ids = {p["product_id"] for p in purchase_history}
            
            logger.info(f"Looking for complementary products for product {purchased_product_id}")
            logger.info(f"User {user_id} has {len(exclude_ids)} previous purchases to exclude")
            
            # Get complementary products
            results = self.neo4j.get_complementary_products(
                product_id=purchased_product_id,
                limit=limit + len(exclude_ids)  # Get extra to account for exclusions
            )
            
            logger.info(f"Neo4j returned {len(results)} complementary products before filtering")
            
            recommendations = []
            for r in results:
                if r["product_id"] not in exclude_ids:
                    recommendations.append({
                        "product_id": r["product_id"],
                        "score": r.get("score", 0),
                        "source": RecommendationSource.COMPLEMENTARY,
                        "reason": f"Complements your recent purchase ({r.get('buyer_count', 0)} buyers also got this)"
                    })
                    if len(recommendations) >= limit:
                        break
            
            logger.info(f"Returning {len(recommendations)} complementary products after filtering")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting complementary products: {e}")
            return []
    
    def get_orchestrated_recommendations(
        self,
        user_id: int,
        total_limit: int = 20,
        behavioral_weight: float = 0.3,
        trending_weight: float = 0.2,
        activity_weight: float = 0.5,
        mmr_diversity: float = 0.7,
        include_reasons: bool = True
    ) -> Dict[str, Any]:
        """
        Get orchestrated recommendations combining all sources intelligently.
        
        Strategy:
        - Determines user mode (browsing vs post-purchase)
        - Browsing: High diversity semantic search + behavioral + trending
        - Post-purchase: Complementary products + behavioral + trending
        
        Args:
            user_id: User ID
            total_limit: Total recommendations to return
            behavioral_weight: Weight for behavioral recommendations (0-1)
            trending_weight: Weight for trending items (0-1)
            activity_weight: Weight for recent activity based recs (0-1)
            mmr_diversity: Diversity for semantic search (browsing mode)
            include_reasons: Include explanation for each recommendation
            
        Returns:
            Dict with recommendations, mode, and metadata
        """
        # Determine user's current mode
        mode, context = self.determine_user_mode(user_id)
        logger.info(f"User {user_id} mode: {mode}, context: {context}")
        
        # Calculate allocation based on weights
        total_weight = behavioral_weight + trending_weight + activity_weight
        behavioral_limit = int((behavioral_weight / total_weight) * total_limit)
        trending_limit = int((trending_weight / total_weight) * total_limit)
        activity_limit = total_limit - behavioral_limit - trending_limit
        
        recommendations = []
        sources_used = []
        
        # Get behavioral recommendations (always included)
        behavioral_recs = self.get_behavioral_recommendations(user_id, behavioral_limit)
        if behavioral_recs:
            recommendations.extend(behavioral_recs)
            sources_used.append(RecommendationSource.BEHAVIORAL)
        
        # Get trending items (always included)
        trending_recs = self.get_trending_items(trending_limit)
        if trending_recs:
            recommendations.extend(trending_recs)
            sources_used.append(RecommendationSource.TRENDING)
        
        # Mode-specific recommendations
        if mode == RecommendationMode.POST_PURCHASE:
            # After purchase: Get complementary products from Neo4j
            purchased_product_id = context.get("last_purchased_product_id")
            if purchased_product_id:
                logger.info(f"Fetching complementary products for product {purchased_product_id}")
                complementary_recs = self.get_complementary_products(
                    purchased_product_id=purchased_product_id,
                    user_id=user_id,
                    limit=activity_limit
                )
                logger.info(f"Found {len(complementary_recs)} complementary products")
                if complementary_recs:
                    recommendations.extend(complementary_recs)
                    sources_used.append(RecommendationSource.COMPLEMENTARY)
                else:
                    logger.warning(f"No complementary products found for product {purchased_product_id}")
                    
        elif mode == RecommendationMode.BROWSING:
            # While browsing: Use semantic search with high diversity
            exclude_ids = [r["product_id"] for r in recommendations]
            similar_recs = self.get_similar_to_recent_activity(
                user_id=user_id,
                limit=activity_limit,
                use_mmr=True,
                mmr_diversity=mmr_diversity,
                exclude_product_ids=exclude_ids
            )
            if similar_recs:
                recommendations.extend(similar_recs)
                sources_used.append(RecommendationSource.SEMANTIC_SIMILAR)
                
        else:  # COLD_START
            # New user: Boost trending items
            additional_trending = self.get_trending_items(activity_limit, event_types=["purchase"])
            exclude_ids = {r["product_id"] for r in recommendations}
            for rec in additional_trending:
                if rec["product_id"] not in exclude_ids:
                    recommendations.append(rec)
        
        # Deduplicate while preserving order and best scores
        seen_ids = {}
        unique_recommendations = []
        for rec in recommendations:
            pid = rec["product_id"]
            if pid not in seen_ids:
                seen_ids[pid] = len(unique_recommendations)
                unique_recommendations.append(rec)
            else:
                # Keep the higher score
                existing_idx = seen_ids[pid]
                if rec["score"] > unique_recommendations[existing_idx]["score"]:
                    unique_recommendations[existing_idx] = rec
        
        # Sort by score and limit
        unique_recommendations.sort(key=lambda x: x["score"], reverse=True)
        final_recommendations = unique_recommendations[:total_limit]
        
        # Enrich recommendations with product data from Qdrant
        final_recommendations = self.enrich_recommendations_with_payload(final_recommendations)
        
        # Clean up recommendations if reasons not needed
        if not include_reasons:
            for rec in final_recommendations:
                rec.pop("reason", None)
        
        return {
            "user_id": user_id,
            "mode": mode,
            "mode_context": context,
            "total_count": len(final_recommendations),
            "sources_used": [s.value for s in set(sources_used)],
            "recommendations": final_recommendations,
            "strategy": self._get_strategy_description(mode)
        }
    
    def _get_strategy_description(self, mode: RecommendationMode) -> str:
        """Get human-readable strategy description"""
        strategies = {
            RecommendationMode.BROWSING: (
                "Exploring mode: Using semantic search with high diversity "
                "to show varied options similar to your recent activity, "
                "combined with behavioral insights and trending items."
            ),
            RecommendationMode.POST_PURCHASE: (
                "Post-purchase mode: Showing complementary products that "
                "other buyers paired with your recent purchase, along with "
                "personalized behavioral recommendations."
            ),
            RecommendationMode.COLD_START: (
                "New user mode: Showing popular and trending products "
                "to help you discover items while we learn your preferences."
            )
        }
        return strategies.get(mode, "Personalized recommendations")
    
    def get_for_you_page(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        mmr_diversity: float = 0.7
    ) -> Dict[str, Any]:
        """
        Get a "For You" page with paginated orchestrated recommendations.
        
        Args:
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Items per page
            mmr_diversity: Diversity for semantic search
            
        Returns:
            Paginated recommendations with metadata
        """
        # Get more recommendations for pagination
        total_needed = page * page_size + page_size  # Buffer for next page
        
        result = self.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=total_needed,
            mmr_diversity=mmr_diversity
        )
        
        # Paginate
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_recommendations = result["recommendations"][start_idx:end_idx]
        
        # Enrich recommendations with product data from Qdrant
        paged_recommendations = self.enrich_recommendations_with_payload(paged_recommendations)
        
        has_more = len(result["recommendations"]) > end_idx
        
        return {
            "user_id": user_id,
            "page": page,
            "page_size": page_size,
            "has_more": has_more,
            "mode": result["mode"],
            "strategy": result["strategy"],
            "recommendations": paged_recommendations
        }


# Singleton instance
_orchestrator_service: Optional[OrchestratorService] = None


def get_orchestrator_service() -> OrchestratorService:
    """Get or create the orchestrator service singleton"""
    global _orchestrator_service
    if _orchestrator_service is None:
        _orchestrator_service = OrchestratorService()
    return _orchestrator_service
