"""
Recommendations Router
Endpoints for product recommendations using Qdrant vector search
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.recommendations import (
    RecommendationRequest,
    RecommendationResponse,
    ProductRecommendation,
)
from app.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Recommendations"], prefix="/recommendations")

# Initialize Qdrant service (singleton pattern)
qdrant_service = QdrantService()


@router.on_event("startup")
async def startup_event():
    """Initialize Qdrant connection and models on startup"""
    try:
        logger.info("Initializing Qdrant service for recommendations...")
        qdrant_service.connect()
        
        # Initialize multimodal models to support both text and image queries
        qdrant_service.initialize_multimodal_models(
            text_model="Qdrant/clip-ViT-B-32-text",
            image_model="Qdrant/clip-ViT-B-32-vision"
        )
        logger.info("Qdrant service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant service: {str(e)}")
        # Don't raise - allow API to start but endpoints will fail gracefully


@router.post("/", status_code=status.HTTP_200_OK, response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get product recommendations based on text or image query with optional filters
    
    This endpoint uses Qdrant vector search to find semantically similar products.
    
    **Query Types:**
    - **Text Only**: Provide `query_text` for semantic text search
    - **Image Only**: Provide `query_image` (URL or path) for visual similarity search
    - **Multimodal**: Provide both for combined search (uses image embedding with text as metadata)
    
    **Filtering:**
    You can filter results by product attributes using the `filters` parameter.
    Supported filters include: category, brand, or any other product metadata.
    
    **Examples:**
    
    ```json
    {
        "query_text": "comfortable running shoes",
        "limit": 10,
        "score_threshold": 0.7,
        "filters": {
            "category": "Sports & Outdoors"
        }
    }
    ```
    
    ```json
    {
        "query_image": "https://example.com/shoe.jpg",
        "limit": 5,
        "filters": {
            "brand": "Nike"
        }
    }
    ```
    """
    # Validate that at least one query type is provided
    if not request.query_text and not request.query_image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of 'query_text' or 'query_image' must be provided"
        )
    
    try:
        # Determine query type
        if request.query_text and request.query_image_url:
            query_type = "multimodal"
        elif request.query_image_url:
            query_type = "image"
        else:
            query_type = "text"
        
        logger.info(
            f"Processing {query_type} recommendation request with "
            f"limit={request.limit}, filters={request.filters}"
        )
        
        # Perform search using Qdrant service
        results = qdrant_service.search(
            query_text=request.query_text,
            query_image=request.query_image_url,
            limit=request.limit,
            score_threshold=request.score_threshold,
            collection_name="products",  # Default collection
            filter_conditions=request.filters,
        )
        
        # Transform results into response format
        recommendations = []
        for result in results:
            payload = result.get("payload", {})
            
            recommendation = ProductRecommendation(
                id=result["id"],
                score=result["score"],
                title=payload.get("title", "Unknown Product"),
                brand=payload.get("brand"),
                category=payload.get("category"),
                price=payload.get("price"),
                image_url=payload.get("image_url") or payload.get("image_path"),
                description=payload.get("description"),
            )
            recommendations.append(recommendation)
        
        logger.info(f"Found {len(recommendations)} recommendations")
        
        return RecommendationResponse(
            query_type=query_type,
            total_results=len(recommendations),
            recommendations=recommendations,
            filters_applied=request.filters,
        )
        
    except ValueError as e:
        # Handle validation errors from Qdrant service
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error processing recommendation request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process recommendation request: {str(e)}"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Check if the recommendation service is healthy and ready
    
    Returns connection status and model initialization status.
    """
    try:
        # Check if client is connected
        if qdrant_service.client is None:
            return {
                "status": "unhealthy",
                "message": "Qdrant client not connected",
                "models_initialized": False
            }
        
        # Check if models are initialized
        models_ready = (
            qdrant_service.text_embedding_model is not None and
            qdrant_service.image_embedding_model is not None
        )
        
        # Get collection info to verify connection
        try:
            collection_info = qdrant_service.get_collection_info("products")
            points_count = collection_info.get("points_count", 0)
        except Exception:
            points_count = None
        
        return {
            "status": "healthy" if models_ready else "degraded",
            "message": "Recommendation service is operational",
            "models_initialized": models_ready,
            "text_model_ready": qdrant_service.text_embedding_model is not None,
            "image_model_ready": qdrant_service.image_embedding_model is not None,
            "collection": "products",
            "indexed_products": points_count,
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "models_initialized": False
        }
