"""
Orchestrator Router
Endpoints for intelligent, multi-source recommendation orchestration.

This router provides a unified recommendation system that:
1. Combines behavioral (Neo4j) + semantic (Qdrant) recommendations
2. Automatically switches strategy based on user state (browsing vs post-purchase)
3. Uses high diversity semantic search while browsing, complementary products after purchase
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
import logging

from app.services.orchestrator_service import (
    OrchestratorService,
    get_orchestrator_service,
)
from app.schemas.orchestrator import (
    OrchestratedRecommendationRequest,
    OrchestratedRecommendationResponse,
    OrchestratedRecommendationItem,
    ForYouPageRequest,
    ForYouPageResponse,
    UserModeResponse,
    SimilarToRecentRequest,
    ComplementaryRequest,
    RecommendationModeEnum,
    RecommendationSourceEnum
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orchestrator"], prefix="/orchestrator")

# Service instance
_service: Optional[OrchestratorService] = None


def get_service() -> OrchestratorService:
    """Get orchestrator service instance with lazy initialization"""
    global _service
    if _service is None:
        _service = get_orchestrator_service()
    return _service


# =========================================================================
# HEALTH & STATUS ENDPOINTS
# =========================================================================

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Check orchestrator service health.
    
    Verifies both Neo4j and Qdrant connections are available.
    """
    try:
        service = get_service()
        
        # Check Neo4j
        neo4j_healthy = service.neo4j.check_connection()
        
        # Check Qdrant
        qdrant_healthy = False
        try:
            if service.qdrant.client:
                service.qdrant.client.get_collections()
                qdrant_healthy = True
        except Exception:
            pass
        
        models_ready = (
            service.qdrant.text_embedding_model is not None
            and service.qdrant.image_embedding_model is not None
        )
        
        overall_status = "healthy" if (neo4j_healthy and qdrant_healthy) else "degraded"
        
        return {
            "status": overall_status,
            "service": "orchestrator",
            "components": {
                "neo4j": "healthy" if neo4j_healthy else "unhealthy",
                "qdrant": "healthy" if qdrant_healthy else "unhealthy",
                "embedding_models": "ready" if models_ready else "not_ready"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Orchestrator health check failed: {str(e)}"
        )


# =========================================================================
# MAIN ORCHESTRATION ENDPOINTS
# =========================================================================

@router.post(
    "/recommendations",
    response_model=OrchestratedRecommendationResponse,
    status_code=status.HTTP_200_OK
)
async def get_orchestrated_recommendations(
    request: OrchestratedRecommendationRequest
):
    """
    Get intelligent, orchestrated recommendations from multiple sources.
    
    **How it works:**
    
    1. **Determines user mode** based on recent activity:
       - `browsing`: User is exploring products
       - `post_purchase`: User recently bought something
       - `cold_start`: New user with no history
    
    2. **Applies mode-specific strategy:**
       - **Browsing**: Uses semantic search with HIGH MMR diversity to help users
         discover varied products similar to their recent views
       - **Post-purchase**: Switches to Neo4j complementary product predictions
         (users who bought X also bought Y)
       - **Cold start**: Relies on trending and popular items
    
    3. **Combines multiple sources:**
       - Behavioral recommendations (collaborative filtering)
       - Trending items
       - Activity-based recommendations (mode-specific)
    
    **Example use case:**
    - User is browsing laptops → Shows diverse laptop options via semantic search
    - User buys a laptop → Automatically switches to suggest mice, keyboards, bags
    
    **Weight parameters:**
    - `behavioral_weight`: How much to emphasize "users like you also liked"
    - `trending_weight`: How much to show popular items
    - `activity_weight`: How much for recent activity-based recommendations
    
    **Diversity:**
    - `mmr_diversity`: Controls variety in browsing mode (0.7 = balanced, 1.0 = max variety)
    """
    try:
        service = get_service()
        
        result = service.get_orchestrated_recommendations(
            user_id=request.user_id,
            total_limit=request.total_limit,
            behavioral_weight=request.behavioral_weight,
            trending_weight=request.trending_weight,
            activity_weight=request.activity_weight,
            mmr_diversity=request.mmr_diversity,
            include_reasons=request.include_reasons
        )
        
        # Convert to response model
        recommendations = [
            OrchestratedRecommendationItem(
                product_id=r["product_id"],
                score=r["score"],
                source=RecommendationSourceEnum(r["source"].value if hasattr(r["source"], 'value') else r["source"]),
                reason=r.get("reason"),
                payload=r.get("payload")
            )
            for r in result["recommendations"]
        ]
        
        return OrchestratedRecommendationResponse(
            user_id=result["user_id"],
            mode=RecommendationModeEnum(result["mode"].value if hasattr(result["mode"], 'value') else result["mode"]),
            mode_context=result.get("mode_context"),
            total_count=result["total_count"],
            sources_used=result["sources_used"],
            strategy=result["strategy"],
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to get orchestrated recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get(
    "/recommendations/{user_id}",
    response_model=OrchestratedRecommendationResponse,
    status_code=status.HTTP_200_OK
)
async def get_recommendations_for_user(
    user_id: int,
    limit: int = Query(20, ge=1, le=100, description="Total recommendations"),
    mmr_diversity: float = Query(0.7, ge=0.0, le=1.0, description="Diversity for browsing mode"),
    include_reasons: bool = Query(True, description="Include explanation for each recommendation")
):
    """
    Get orchestrated recommendations for a user (simplified GET endpoint).
    
    This is a convenience endpoint that uses default weights.
    For full control, use POST /orchestrator/recommendations.
    """
    try:
        service = get_service()
        
        result = service.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=limit,
            mmr_diversity=mmr_diversity,
            include_reasons=include_reasons
        )
        
        recommendations = [
            OrchestratedRecommendationItem(
                product_id=r["product_id"],
                score=r["score"],
                source=RecommendationSourceEnum(r["source"].value if hasattr(r["source"], 'value') else r["source"]),
                reason=r.get("reason"),
                payload=r.get("payload")
            )
            for r in result["recommendations"]
        ]
        
        return OrchestratedRecommendationResponse(
            user_id=result["user_id"],
            mode=RecommendationModeEnum(result["mode"].value if hasattr(result["mode"], 'value') else result["mode"]),
            mode_context=result.get("mode_context"),
            total_count=result["total_count"],
            sources_used=result["sources_used"],
            strategy=result["strategy"],
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to get recommendations for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


# =========================================================================
# FOR YOU PAGE ENDPOINT
# =========================================================================

@router.post(
    "/for-you",
    response_model=ForYouPageResponse,
    status_code=status.HTTP_200_OK
)
async def get_for_you_page(request: ForYouPageRequest):
    """
    Get paginated "For You" recommendations.
    
    Ideal for infinite scroll or paginated home page recommendations.
    Automatically handles mode switching and source combination.
    """
    try:
        service = get_service()
        
        result = service.get_for_you_page(
            user_id=request.user_id,
            page=request.page,
            page_size=request.page_size,
            mmr_diversity=request.mmr_diversity
        )
        
        recommendations = [
            OrchestratedRecommendationItem(
                product_id=r["product_id"],
                score=r["score"],
                source=RecommendationSourceEnum(r["source"].value if hasattr(r["source"], 'value') else r["source"]),
                reason=r.get("reason"),
                payload=r.get("payload")
            )
            for r in result["recommendations"]
        ]
        
        return ForYouPageResponse(
            user_id=result["user_id"],
            page=result["page"],
            page_size=result["page_size"],
            has_more=result["has_more"],
            mode=RecommendationModeEnum(result["mode"].value if hasattr(result["mode"], 'value') else result["mode"]),
            strategy=result["strategy"],
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to get for-you page: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get for-you page: {str(e)}"
        )


@router.get(
    "/for-you/{user_id}",
    response_model=ForYouPageResponse,
    status_code=status.HTTP_200_OK
)
async def get_for_you_page_simple(
    user_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=50, description="Items per page"),
    mmr_diversity: float = Query(0.7, ge=0.0, le=1.0, description="Diversity")
):
    """
    Get paginated "For You" recommendations (GET endpoint).
    """
    try:
        service = get_service()
        
        result = service.get_for_you_page(
            user_id=user_id,
            page=page,
            page_size=page_size,
            mmr_diversity=mmr_diversity
        )
        
        recommendations = [
            OrchestratedRecommendationItem(
                product_id=r["product_id"],
                score=r["score"],
                source=RecommendationSourceEnum(r["source"].value if hasattr(r["source"], 'value') else r["source"]),
                reason=r.get("reason"),
                payload=r.get("payload")
            )
            for r in result["recommendations"]
        ]
        
        return ForYouPageResponse(
            user_id=result["user_id"],
            page=result["page"],
            page_size=result["page_size"],
            has_more=result["has_more"],
            mode=RecommendationModeEnum(result["mode"].value if hasattr(result["mode"], 'value') else result["mode"]),
            strategy=result["strategy"],
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to get for-you page: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get for-you page: {str(e)}"
        )


# =========================================================================
# USER MODE ENDPOINT
# =========================================================================

@router.get(
    "/user-mode/{user_id}",
    response_model=UserModeResponse,
    status_code=status.HTTP_200_OK
)
async def get_user_mode(
    user_id: int,
    lookback_hours: int = Query(24, ge=1, le=168, description="Hours to check for recent purchases")
):
    """
    Get the current recommendation mode for a user.
    
    **Modes:**
    - `browsing`: User is exploring, will get diverse semantic recommendations
    - `post_purchase`: User just bought something, will get complementary products
    - `cold_start`: New user, will get trending/popular items
    
    Useful for:
    - UI customization based on user state
    - Understanding why certain recommendations are shown
    - Debugging recommendation strategies
    """
    try:
        service = get_service()
        
        mode, context = service.determine_user_mode(user_id, lookback_hours)
        strategy = service._get_strategy_description(mode)
        
        return UserModeResponse(
            user_id=user_id,
            mode=RecommendationModeEnum(mode.value),
            context=context,
            strategy_description=strategy
        )
        
    except Exception as e:
        logger.error(f"Failed to get user mode: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user mode: {str(e)}"
        )


# =========================================================================
# INDIVIDUAL SOURCE ENDPOINTS
# =========================================================================

@router.post(
    "/similar-to-recent",
    status_code=status.HTTP_200_OK
)
async def get_similar_to_recent_activity(request: SimilarToRecentRequest):
    """
    Get products semantically similar to user's recent activity.
    
    **How it works:**
    1. Fetches user's recently viewed/carted products from Neo4j
    2. Uses their embeddings to find similar products in Qdrant
    3. Applies MMR for diversity to show varied options
    
    **Use case:**
    - "Based on your recent activity" section
    - User viewed laptops → Show more laptops with variety
    """
    try:
        service = get_service()
        
        results = service.get_similar_to_recent_activity(
            user_id=request.user_id,
            limit=request.limit,
            use_mmr=request.use_mmr,
            mmr_diversity=request.mmr_diversity,
            exclude_product_ids=request.exclude_product_ids
        )
        
        # Enrich recommendations with product data
        results = service.enrich_recommendations_with_payload(results)
        
        return {
            "user_id": request.user_id,
            "count": len(results),
            "source": "semantic_similar",
            "recommendations": results
        }
        
    except Exception as e:
        logger.error(f"Failed to get similar to recent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similar products: {str(e)}"
        )


@router.post(
    "/complementary",
    status_code=status.HTTP_200_OK
)
async def get_complementary_products(request: ComplementaryRequest):
    """
    Get complementary products after a purchase.
    
    **How it works:**
    - Uses Neo4j to find products that other users bought AFTER purchasing this item
    - Excludes items the user has already purchased
    
    **Use case:**
    - Post-purchase recommendations
    - "Complete your setup" suggestions
    - User bought laptop → Suggest mouse, keyboard, bag
    """
    try:
        service = get_service()
        
        results = service.get_complementary_products(
            purchased_product_id=request.purchased_product_id,
            user_id=request.user_id,
            limit=request.limit
        )
        
        # Enrich recommendations with product data
        results = service.enrich_recommendations_with_payload(results)
        
        return {
            "user_id": request.user_id,
            "purchased_product_id": request.purchased_product_id,
            "count": len(results),
            "source": "complementary",
            "recommendations": results
        }
        
    except Exception as e:
        logger.error(f"Failed to get complementary products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get complementary products: {str(e)}"
        )


@router.get(
    "/behavioral/{user_id}",
    status_code=status.HTTP_200_OK
)
async def get_behavioral_recommendations(
    user_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum recommendations")
):
    """
    Get behavioral recommendations from Neo4j collaborative filtering.
    
    "Users like you also liked..."
    """
    try:
        service = get_service()
        
        results = service.get_behavioral_recommendations(user_id, limit)
        
        # Enrich recommendations with product data
        results = service.enrich_recommendations_with_payload(results)
        
        return {
            "user_id": user_id,
            "count": len(results),
            "source": "behavioral",
            "recommendations": results
        }
        
    except Exception as e:
        logger.error(f"Failed to get behavioral recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get behavioral recommendations: {str(e)}"
        )


@router.get(
    "/trending",
    status_code=status.HTTP_200_OK
)
async def get_trending(
    limit: int = Query(10, ge=1, le=50, description="Maximum products"),
    event_type: Optional[str] = Query(None, description="Filter by event type (view, cart, purchase)")
):
    """
    Get trending products from Neo4j.
    
    - No filter: Most interacted products overall
    - `event_type=purchase`: Best sellers
    - `event_type=cart`: Most added to cart
    """
    try:
        service = get_service()
        
        event_types = [event_type] if event_type else None
        results = service.get_trending_items(limit, event_types)
        
        # Enrich recommendations with product data
        results = service.enrich_recommendations_with_payload(results)
        
        return {
            "count": len(results),
            "source": "trending",
            "filter": event_type,
            "recommendations": results
        }
        
    except Exception as e:
        logger.error(f"Failed to get trending items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending items: {str(e)}"
        )
