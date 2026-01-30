from fastapi import APIRouter, Depends, Query, status
from app.db.database import get_db
from app.services.products import ProductService
from sqlalchemy.orm import Session
from app.schemas.products import ProductCreate, ProductOut, ProductsOut, ProductOutDelete, ProductUpdate
from app.core.security import get_current_user, check_admin_role
from app.services.qdrant_service import qdrant_service
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Products"], prefix="/products")


# Get Price Range (min and max prices)
@router.get("/price-range", status_code=status.HTTP_200_OK)
def get_price_range(db: Session = Depends(get_db)):
    return ProductService.get_price_range(db)


# Get All Products
@router.get("/", status_code=status.HTTP_200_OK, response_model=ProductsOut)
def get_all_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query("", description="Search based title of products"),
    category: str | None = Query(None, description="Filter by category (comma-separated for multiple: Apparel,Electronics)"),
    minPrice: float | None = Query(None, description="Minimum price filter"),
    maxPrice: float | None = Query(None, description="Maximum price filter"),
    sort_by: str | None = Query(None, description="Sort by field (price, title, product_id)"),
    order: str = Query("asc", description="Sort order (asc or desc)"),
):
    return ProductService.get_all_products(db, page, limit, search, category, minPrice, maxPrice, sort_by, order)


# Get Product By ID
@router.get("/{product_id}", status_code=status.HTTP_200_OK, response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService.get_product(db, product_id)


# Create New Product
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ProductOut,
    dependencies=[Depends(check_admin_role)])
def create_product(
        product: ProductCreate,
        db: Session = Depends(get_db)):
    return ProductService.create_product(db, product)


# Update Exist Product
@router.put(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductOut,
    dependencies=[Depends(check_admin_role)])
def update_product(
        product_id: int,
        updated_product: ProductUpdate,
        db: Session = Depends(get_db)):
    return ProductService.update_product(db, product_id, updated_product)


# Delete Product By ID
@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    response_model=ProductOutDelete,
    dependencies=[Depends(check_admin_role)])
def delete_product(
        product_id: int,
        db: Session = Depends(get_db)):
    return ProductService.delete_product(db, product_id)


# Semantic Search Products using Qdrant
@router.get("/search/semantic", status_code=status.HTTP_200_OK)
def semantic_search_products(
    query: str = Query(..., description="Search query text"),
    limit: int = Query(10, ge=1, le=100, description="Number of results to return"),
    score_threshold: float | None = Query(None, ge=0.0, le=1.0, description="Minimum similarity score"),
    category: str | None = Query(None, description="Filter by category"),
    use_mmr: bool = Query(False, description="Use MMR for diverse results"),
    mmr_diversity: float = Query(0.5, ge=0.0, le=1.0, description="MMR diversity parameter"),
    db: Session = Depends(get_db),
):
    """
    Search products using semantic/vector search powered by Qdrant.
    
    This endpoint uses CLIP embeddings to find products based on meaning rather than exact keyword matches.
    
    **Examples:**
    - "comfortable shoes for running" 
    - "blue jeans for women"
    - "wireless headphones with noise cancelling"
    
    **Parameters:**
    - `query`: Natural language search query
    - `limit`: Maximum number of results (default: 10, max: 100)
    - `score_threshold`: Filter results by minimum similarity score (0-1)
    - `category`: Filter results by specific category
    - `use_mmr`: Enable Maximal Marginal Relevance for diverse results
    - `mmr_diversity`: Balance between relevance (0.0) and diversity (1.0)
    """
    try:
        # Ensure Qdrant is connected
        if not qdrant_service.client:
            qdrant_service.connect()
            qdrant_service.initialize_multimodal_models()
        
        # Prepare filters
        filter_conditions = {}
        if category:
            filter_conditions["category"] = category
        
        # Search using Qdrant
        results = qdrant_service.search(
            query_text=query,
            limit=limit,
            score_threshold=score_threshold,
            filter_conditions=filter_conditions if filter_conditions else None,
            use_mmr=use_mmr,
            mmr_diversity=mmr_diversity,
        )
        
        # Get product IDs from Qdrant results
        product_ids = [result["id"] for result in results]
        
        if not product_ids:
            return {
                "data": [],
                "total": 0,
                "page": 1,
                "limit": limit,
                "query_type": "semantic",
            }
        
        # Fetch full product details from database
        products = ProductService.get_products_by_ids(db, product_ids)
        
        # Create a score map for sorting
        score_map = {result["id"]: result["score"] for result in results}
        
        # Sort products by Qdrant similarity score
        products_sorted = sorted(
            products,
            key=lambda p: score_map.get(p.product_id, 0),
            reverse=True
        )
        
        return {
            "data": products_sorted,
            "total": len(products_sorted),
            "page": 1,
            "limit": limit,
            "query_type": "semantic",
            "scores": score_map,  # Include similarity scores
        }
        
    except Exception as e:
        logger.error(f"Semantic search failed: {str(e)}")
        # Fallback to regular search if Qdrant fails
        logger.warning("Falling back to regular text search")
        return ProductService.get_all_products(
            db=db,
            page=1,
            limit=limit,
            search=query,
            category=category,
        )
