"""
Recommendations Router
Endpoints for product recommendations using Qdrant vector search
"""

from fastapi import APIRouter, HTTPException, status
import logging
import tempfile
import os
import requests as http_requests
from urllib.parse import urlparse

from app.schemas.recommendations import (
    RecommendationRequest,
    RecommendationResponse,
    ProductRecommendation,
    OrbitViewRequest,
    OrbitViewResponse,
    ProductOrbitPoint,
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
            image_model="Qdrant/clip-ViT-B-32-vision",
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
            detail="At least one of 'query_text' or 'query_image' must be provided",
        )

    temp_image_path = None
    try:
        # Handle image URL - download if it's a URL
        image_path_or_url = request.query_image_url
        if image_path_or_url:
            parsed = urlparse(image_path_or_url)
            # Check if it's a URL (has scheme like http/https)
            if parsed.scheme in ("http", "https"):
                try:
                    # Download the image
                    response = http_requests.get(image_path_or_url, timeout=10)
                    response.raise_for_status()

                    # Save to temporary file
                    suffix = os.path.splitext(parsed.path)[1] or ".jpg"
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                    temp_file.write(response.content)
                    temp_file.close()
                    temp_image_path = temp_file.name
                    image_path_or_url = temp_image_path
                    logger.info(f"Downloaded image from URL to {temp_image_path}")
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to download image from URL: {str(e)}",
                    )

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
            query_image=image_path_or_url,
            limit=request.limit,
            score_threshold=request.score_threshold,
            collection_name="products",  # Default collection
            filter_conditions=request.filters,
            use_mmr=request.use_mmr,
            mmr_diversity=request.mmr_diversity,
            mmr_candidates=request.mmr_candidates,
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error processing recommendation request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process recommendation request: {str(e)}",
        )
    finally:
        # Clean up temporary image file
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.unlink(temp_image_path)
                logger.info(f"Cleaned up temporary image file: {temp_image_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file {temp_image_path}: {e}")


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
                "models_initialized": False,
            }

        # Check if models are initialized
        models_ready = (
            qdrant_service.text_embedding_model is not None
            and qdrant_service.image_embedding_model is not None
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
            "models_initialized": False,
        }


@router.post("/orbit-view", status_code=status.HTTP_200_OK, response_model=OrbitViewResponse)
async def get_orbit_view(request: OrbitViewRequest):
    """
    Get products in 3D semantic space for orbit visualization
    
    Transforms the 512-dimensional CLIP embedding space into an interactive 3D
    visualization where products are positioned by semantic similarity.
    
    **Process:**
    1. Performs vector search using the query text (or scroll with filters as fallback)
    2. Retrieves 512-dimensional embeddings for top N products
    3. Applies UMAP dimensionality reduction (512d → 3d)
    4. Normalizes coordinates so center of mass is at origin (0,0,0)
    5. Returns products with 3D positions for visualization
    
    **Use Case:**
    Powers the "Launch Into Orbit" 3D visualization feature that reveals
    the semantic space underlying product search.
    
    **Example:**
    ```json
    {
        "query_text": "comfortable running shoes",
        "limit": 150,
        "filters": {"category": "Sports & Outdoors"}
    }
    ```
    """
    try:
        logger.info(f"Processing orbit view request: query='{request.query_text}', limit={request.limit}")
        
        search_results = None
        use_fallback = False
        
        # Step 1: Try vector search first
        try:
            search_results = qdrant_service.search(
                query_text=request.query_text,
                limit=request.limit,
                score_threshold=0.1,  # Low threshold for CLIP embeddings (scores ~0.25-0.35)
                collection_name="products",
                filter_conditions=request.filters,
                use_mmr=True,  # Use MMR for diverse product selection
                mmr_diversity=0.5,  # High diversity for better 3D spread
            )
        except Exception as search_error:
            logger.warning(f"Vector search failed, falling back to scroll: {search_error}")
            use_fallback = True
        
        # Step 1b: Fallback - scroll products with their existing vectors
        # This still provides semantic visualization using stored CLIP embeddings
        if not search_results and use_fallback:
            logger.info("Using scroll fallback with existing vectors")
            scrolled_products = qdrant_service.scroll_products(
                limit=request.limit,
                with_vectors=True,
            )
            
            if scrolled_products:
                # Convert scroll results to search-like format
                search_results = []
                for product in scrolled_products:
                    payload = product.get("payload", {})
                    search_results.append({
                        "id": product["id"],
                        "score": 1.0,  # No similarity score in scroll mode
                        "payload": payload,
                        "_vector": product.get("vector"),  # Keep vector for later
                    })
        
        if not search_results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No products found matching the query"
            )
        
        # Step 2: Extract product IDs and build product metadata
        product_ids = [result["id"] for result in search_results]
        product_metadata = {}
        prefetched_vectors = {}  # Store vectors from scroll fallback
        
        for result in search_results:
            payload = result.get("payload", {})
            product_metadata[result["id"]] = {
                "title": payload.get("title", "Unknown Product"),
                "brand": payload.get("brand"),
                "category": payload.get("category"),
                "price": payload.get("price"),
                "imgUrl": payload.get("image_url") or payload.get("imgUrl"),
                "similarity_score": result["score"],
            }
            # Store pre-fetched vector if available (from scroll fallback)
            if "_vector" in result and result["_vector"]:
                prefetched_vectors[result["id"]] = result["_vector"]
        
        # Step 3: Retrieve 512-dimensional vectors from Qdrant (or use prefetched)
        if prefetched_vectors:
            vectors_map = prefetched_vectors
            logger.info(f"Using {len(vectors_map)} pre-fetched vectors from scroll")
        else:
            vectors_map = qdrant_service.get_product_vectors(
                product_ids=product_ids,
                with_vectors=True
            )
        
        if not vectors_map:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve product vectors from Qdrant"
            )
        
        # Step 4: Prepare vectors in same order as product_ids
        vectors = []
        ordered_ids = []
        for pid in product_ids:
            if pid in vectors_map:
                vectors.append(vectors_map[pid])
                ordered_ids.append(pid)
        
        if len(vectors) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough products to create 3D visualization (minimum 2 required)"
            )
        
        # Step 5: Apply UMAP dimensionality reduction (512d → 3d)
        logger.info(f"Reducing {len(vectors)} vectors from 512d to 3d using UMAP...")
        coordinates_3d = qdrant_service.reduce_dimensions_umap(
            vectors=vectors,
            n_components=3,
            n_neighbors=min(15, len(vectors) - 1),  # Adjust for small datasets
            min_dist=0.1,
            metric="cosine"
        )
        
        # Step 6: Build response with products and 3D positions
        products = []
        for i, product_id in enumerate(ordered_ids):
            metadata = product_metadata[product_id]
            
            product_point = ProductOrbitPoint(
                product_id=product_id,
                title=metadata["title"],
                brand=metadata["brand"],
                category=metadata["category"],
                price=metadata["price"],
                imgUrl=metadata["imgUrl"],
                position={
                    "x": float(coordinates_3d[i][0]),
                    "y": float(coordinates_3d[i][1]),
                    "z": float(coordinates_3d[i][2]),
                },
                similarity_score=metadata["similarity_score"]
            )
            products.append(product_point)
        
        logger.info(f"Successfully created orbit view with {len(products)} products")
        
        return OrbitViewResponse(
            query_text=request.query_text,
            query_position={"x": 0.0, "y": 0.0, "z": 0.0},  # Query at origin (center)
            total_products=len(products),
            products=products,
            dimension_info={
                "original_dimensions": 512,
                "reduced_dimensions": 3,
                "method": "UMAP",
                "centered_at_origin": True,
                "scale_range": "±10 units"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing orbit view request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate orbit view: {str(e)}"
        )
