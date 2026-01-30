"""
Behavioral Recommendations Router
Endpoints for product recommendations using Neo4j graph-based collaborative filtering
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import logging

from app.services.neo4j_service import get_neo4j_service, Neo4jService
from app.services.events import EventService
from app.schemas.events import EventCreate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Behavioral Recommendations"], prefix="/behavioral")
auth_scheme = HTTPBearer(auto_error=False)

# Service instance
_service: Optional[Neo4jService] = None


def get_service() -> Neo4jService:
    """Get Neo4j service instance with lazy initialization"""
    global _service
    if _service is None:
        _service = get_neo4j_service()
    return _service


# =========================================================================
# REQUEST/RESPONSE MODELS
# =========================================================================

from datetime import datetime
from typing import Literal

class InteractionRequest(BaseModel):
    """Request to record a user interaction"""
    user_id: int = Field(..., description="User ID")
    product_id: int = Field(..., description="Product ID")
    event_type: Literal["purchase", "cart", "view"] = Field(..., description="Event type: view, cart, purchase")
    session_id: Optional[str] = Field(None, description="Session identifier")
    event_time: Optional[datetime] = Field(None, description="Event timestamp")


class BatchInteractionRequest(BaseModel):
    """Request to record multiple interactions"""
    interactions: List[InteractionRequest]


class ProductRecommendation(BaseModel):
    """A product recommendation with score"""
    product_id: int
    score: float = 0.0
    reason: Optional[str] = None


class RecommendationsResponse(BaseModel):
    """Response containing product recommendations"""
    recommendations: List[ProductRecommendation]
    source: str = "neo4j_behavioral"
    count: int


class ProductStatsResponse(BaseModel):
    """Product interaction statistics"""
    product_id: int
    total_interactions: int
    unique_users: int
    views: int
    carts: int
    purchases: int
    conversion_rate: float


class DatabaseStatsResponse(BaseModel):
    """Database statistics"""
    users: int
    products: int
    interactions: int


class RerankRequest(BaseModel):
    """Request to re-rank product IDs"""
    product_ids: List[int] = Field(..., description="Product IDs to re-rank")
    user_id: Optional[int] = Field(None, description="User ID for personalized ranking")
    limit: Optional[int] = Field(None, description="Limit results")


class RerankResponse(BaseModel):
    """Re-ranked products response"""
    products: List[dict]
    personalized: bool


# =========================================================================
# HEALTH & STATS ENDPOINTS
# =========================================================================

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Check Neo4j connection health"""
    try:
        service = get_service()
        is_connected = service.check_connection()
        if is_connected:
            return {"status": "healthy", "service": "neo4j"}
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Neo4j connection is not available"
            )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Neo4j health check failed: {str(e)}"
        )


@router.get("/stats", response_model=DatabaseStatsResponse)
async def get_database_stats():
    """Get Neo4j database statistics"""
    try:
        service = get_service()
        stats = service.get_stats()
        return DatabaseStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get database stats: {str(e)}"
        )


# =========================================================================
# INTERACTION TRACKING ENDPOINTS
# =========================================================================

@router.post("/interactions", status_code=status.HTTP_201_CREATED)
async def record_interaction(
    request: InteractionRequest,
    token: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
):
    """
    Record a user interaction with a product.
    
    This endpoint tracks user behavior for collaborative filtering recommendations.
    Streams events directly to Neo4j graph database.
    
    **Event Types:**
    - `view`: User viewed the product
    - `cart`: User added to cart
    - `purchase`: User purchased the product
    """
    # Convert to EventCreate schema
    event = EventCreate(
        event_time=request.event_time,
        event_type=request.event_type,
        product_id=request.product_id,
        user_id=request.user_id,
        user_session=request.session_id or "behavioral_api"
    )
    token_str = token.credentials if token else None
    return EventService.create_event(event, token_str)


@router.post("/interactions/batch", status_code=status.HTTP_201_CREATED)
async def record_batch_interactions(
    request: BatchInteractionRequest,
    token: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
):
    """Record multiple interactions in a single request. Streams to Neo4j."""
    # Convert to EventCreate schema list
    events = [
        EventCreate(
            event_time=i.event_time,
            event_type=i.event_type,
            product_id=i.product_id,
            user_id=i.user_id,
            user_session=i.session_id or "behavioral_api"
        )
        for i in request.interactions
    ]
    token_str = token.credentials if token else None
    return EventService.create_batch_events(events, token_str)


# =========================================================================
# USER-BASED RECOMMENDATION ENDPOINTS
# =========================================================================

@router.get("/users/{user_id}/recommendations", response_model=RecommendationsResponse)
async def get_user_recommendations(
    user_id: int,
    limit: int = Query(10, ge=1, le=100, description="Maximum recommendations"),
    min_shared: int = Query(1, ge=1, description="Minimum shared products with similar users")
):
    """
    Get personalized recommendations for a user using collaborative filtering.
    
    This finds products that similar users (who liked the same things) have interacted with.
    
    **Algorithm:**
    1. Find products the user has interacted with
    2. Find other users who interacted with those same products
    3. Find products those similar users liked that this user hasn't seen
    4. Rank by weighted interaction scores
    """
    try:
        service = get_service()
        results = service.get_collaborative_recommendations(
            user_id=user_id,
            limit=limit,
            min_shared_products=min_shared
        )
        
        recommendations = [
            ProductRecommendation(
                product_id=r["product_id"],
                score=r.get("total_score", 0),
                reason=f"Recommended by {r.get('recommender_count', 0)} similar users"
            )
            for r in results
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            source="collaborative_filtering",
            count=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Failed to get recommendations for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/users/{user_id}/similar", response_model=List[dict])
async def get_similar_users(
    user_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum similar users")
):
    """
    Find users with similar behavior patterns.
    
    Uses Jaccard similarity based on shared product interactions.
    """
    try:
        service = get_service()
        results = service.get_similar_users(user_id=user_id, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Failed to get similar users for {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similar users: {str(e)}"
        )


@router.get("/users/{user_id}/history", response_model=List[dict])
async def get_user_history(
    user_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum interactions"),
    event_type: Optional[str] = Query(None, description="Filter by event type")
):
    """Get a user's interaction history"""
    try:
        service = get_service()
        event_types = [event_type] if event_type else None
        results = service.get_user_history(
            user_id=user_id,
            limit=limit,
            event_types=event_types
        )
        return results
    except Exception as e:
        logger.error(f"Failed to get history for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user history: {str(e)}"
        )


# =========================================================================
# PRODUCT-BASED RECOMMENDATION ENDPOINTS
# =========================================================================

@router.get("/products/{product_id}/similar", response_model=RecommendationsResponse)
async def get_similar_products(
    product_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum similar products")
):
    """
    Get products similar to this one based on user behavior.
    
    "Users who viewed this product also viewed..."
    """
    try:
        service = get_service()
        results = service.get_similar_products(product_id=product_id, limit=limit)
        
        recommendations = [
            ProductRecommendation(
                product_id=r["product_id"],
                score=r.get("shared_users", 0),
                reason=f"Viewed by {r.get('shared_users', 0)} users who also viewed this"
            )
            for r in results
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            source="product_similarity",
            count=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Failed to get similar products for {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similar products: {str(e)}"
        )


@router.get("/products/{product_id}/bought-together", response_model=RecommendationsResponse)
async def get_frequently_bought_together(
    product_id: int,
    limit: int = Query(5, ge=1, le=20, description="Maximum products")
):
    """
    Get products frequently purchased together with this one.
    
    Based on same-session purchase data.
    """
    try:
        service = get_service()
        results = service.get_frequently_bought_together(product_id=product_id, limit=limit)
        
        recommendations = [
            ProductRecommendation(
                product_id=r["product_id"],
                score=r.get("co_purchase_count", 0),
                reason=f"Purchased together {r.get('co_purchase_count', 0)} times"
            )
            for r in results
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            source="frequently_bought_together",
            count=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Failed to get bought-together for {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get frequently bought together: {str(e)}"
        )


@router.get("/products/{product_id}/also-viewed", response_model=RecommendationsResponse)
async def get_also_viewed(
    product_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum products")
):
    """
    Get products also viewed in the same session.
    """
    try:
        service = get_service()
        results = service.get_also_viewed(product_id=product_id, limit=limit)
        
        recommendations = [
            ProductRecommendation(
                product_id=r["product_id"],
                score=r.get("user_count", 0),
                reason=f"Also viewed by {r.get('user_count', 0)} users"
            )
            for r in results
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            source="also_viewed",
            count=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Failed to get also-viewed for {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get also viewed products: {str(e)}"
        )


@router.get("/products/{product_id}/stats", response_model=ProductStatsResponse)
async def get_product_stats(product_id: int):
    """Get interaction statistics for a product"""
    try:
        service = get_service()
        stats = service.get_product_stats(product_id=product_id)
        
        if stats is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found"
            )
        
        return ProductStatsResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get stats for product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product stats: {str(e)}"
        )


# =========================================================================
# TRENDING & POPULARITY ENDPOINTS
# =========================================================================

@router.get("/trending", response_model=RecommendationsResponse)
async def get_trending_products(
    limit: int = Query(10, ge=1, le=100, description="Maximum products"),
    event_type: Optional[str] = Query(None, description="Filter by event type")
):
    """
    Get trending/popular products based on recent interactions.
    
    Optionally filter by event type (view, cart, purchase).
    """
    try:
        service = get_service()
        event_types = [event_type] if event_type else None
        results = service.get_trending_products(limit=limit, event_types=event_types)
        
        recommendations = [
            ProductRecommendation(
                product_id=r["product_id"],
                score=r.get("total_interactions", 0),
                reason=f"{r.get('unique_users', 0)} unique users"
            )
            for r in results
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            source="trending",
            count=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Failed to get trending products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending products: {str(e)}"
        )


# =========================================================================
# RE-RANKING ENDPOINTS (for hybrid recommendations)
# =========================================================================

@router.post("/rerank", response_model=RerankResponse)
async def rerank_products(request: RerankRequest):
    """
    Re-rank a list of product IDs by behavioral signals.
    
    Use this to re-rank semantic search results from Qdrant.
    
    - If `user_id` is provided: personalized ranking based on similar users
    - Otherwise: ranking based on global popularity
    """
    try:
        service = get_service()
        
        if request.user_id:
            results = service.rerank_for_user(
                product_ids=request.product_ids,
                user_id=request.user_id,
                limit=request.limit
            )
            personalized = True
        else:
            results = service.rerank_by_popularity(
                product_ids=request.product_ids,
                limit=request.limit
            )
            personalized = False
        
        return RerankResponse(products=results, personalized=personalized)
    except Exception as e:
        logger.error(f"Failed to rerank products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rerank products: {str(e)}"
        )
