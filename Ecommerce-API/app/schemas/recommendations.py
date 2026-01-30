"""
Recommendation Schemas
Request and response models for product recommendations
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    """Request schema for product recommendations"""

    query_text: Optional[str] = Field(
        None, description="Text query for semantic search (e.g., 'blue running shoes')"
    )
    query_image_url: Optional[str] = Field(
        None,
        alias="query_image",
        description="URL or path to image for visual similarity search",
    )
    limit: int = Field(
        10, ge=1, le=100, description="Maximum number of recommendations to return"
    )
    score_threshold: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Minimum similarity score threshold (0-1)"
    )
    filters: Optional[Dict[str, Any]] = Field(
        None,
        description="Filter conditions (e.g., {'category': 'Electronics', 'brand': 'Sony'})",
    )
    use_mmr: bool = Field(
        False, description="Enable MMR (Maximal Marginal Relevance) for diverse results"
    )
    mmr_diversity: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="MMR diversity parameter: 0.0 = pure relevance, 1.0 = maximum diversity",
    )
    mmr_candidates: Optional[int] = Field(
        None,
        ge=1,
        description="Number of candidates to fetch before applying MMR (default: limit * 10)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query_text": "comfortable running shoes",
                "limit": 5,
                "score_threshold": 0.7,
                "filters": {"category": "Sports & Outdoors"},
                "use_mmr": True,
                "mmr_diversity": 0.6,
                "mmr_candidates": 50,
            }
        }


class ProductRecommendation(BaseModel):
    """Individual product recommendation"""

    id: int = Field(..., description="Product ID from Qdrant")
    score: float = Field(..., description="Similarity score (0-1)")
    title: str = Field(..., description="Product title")
    brand: Optional[str] = Field(None, description="Product brand")
    category: Optional[str] = Field(None, description="Product category")
    price: Optional[float] = Field(None, description="Product price")
    image_url: Optional[str] = Field(None, description="Product image URL")
    description: Optional[str] = Field(None, description="Product description")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 12345,
                "score": 0.89,
                "title": "Nike Air Zoom Pegasus 38 Running Shoes",
                "brand": "Nike",
                "category": "Sports & Outdoors",
                "price": 119.99,
                "image_url": "https://example.com/image.jpg",
                "description": "Comfortable running shoes with responsive cushioning",
            }
        }


class RecommendationResponse(BaseModel):
    """Response schema for product recommendations"""

    query_type: str = Field(
        ..., description="Type of query used: 'text', 'image', or 'multimodal'"
    )
    total_results: int = Field(..., description="Number of recommendations returned")
    recommendations: List[ProductRecommendation] = Field(
        ..., description="List of recommended products"
    )
    filters_applied: Optional[Dict[str, Any]] = Field(
        None, description="Filters that were applied to the search"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query_type": "text",
                "total_results": 5,
                "recommendations": [
                    {
                        "id": 12345,
                        "score": 0.89,
                        "title": "Nike Air Zoom Pegasus 38",
                        "brand": "Nike",
                        "category": "Sports & Outdoors",
                        "price": 119.99,
                        "image_url": "https://example.com/image.jpg",
                    }
                ],
                "filters_applied": {"category": "Sports & Outdoors"},
            }
        }


class ProductOrbitPoint(BaseModel):
    """Product with 3D coordinates in semantic space"""

    product_id: int = Field(..., description="Product ID")
    title: str = Field(..., description="Product title")
    brand: Optional[str] = Field(None, description="Product brand")
    category: Optional[str] = Field(None, description="Product category")
    price: Optional[float] = Field(None, description="Product price")
    imgUrl: Optional[str] = Field(None, description="Product image URL")
    position: Dict[str, float] = Field(
        ..., description="3D coordinates {x, y, z} in semantic space"
    )
    similarity_score: float = Field(
        ..., ge=0.0, le=1.0, description="Similarity score to query (0-1)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 12345,
                "title": "Nike Air Zoom Pegasus 38",
                "brand": "Nike",
                "category": "Sports & Outdoors",
                "price": 119.99,
                "imgUrl": "https://example.com/image.jpg",
                "position": {"x": 2.45, "y": -1.32, "z": 3.87},
                "similarity_score": 0.89,
            }
        }


class OrbitViewRequest(BaseModel):
    """Request schema for orbit view 3D visualization"""

    query_text: str = Field(..., description="Search query to visualize in 3D space")
    limit: int = Field(
        100, ge=10, le=500, description="Number of products to visualize (10-500)"
    )
    filters: Optional[Dict[str, Any]] = Field(
        None, description="Optional filters (category, brand, price range)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query_text": "comfortable running shoes",
                "limit": 150,
                "filters": {"category": "Sports & Outdoors"},
            }
        }


class OrbitViewResponse(BaseModel):
    """Response schema for orbit view 3D visualization"""

    query_text: str = Field(..., description="Original search query")
    query_position: Dict[str, float] = Field(
        ..., description="3D position of query vector at origin {x: 0, y: 0, z: 0}"
    )
    total_products: int = Field(..., description="Number of products in visualization")
    products: List[ProductOrbitPoint] = Field(
        ..., description="Products with 3D coordinates"
    )
    dimension_info: Dict[str, Any] = Field(
        ..., description="Information about dimensionality reduction"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query_text": "comfortable running shoes",
                "query_position": {"x": 0.0, "y": 0.0, "z": 0.0},
                "total_products": 150,
                "products": [
                    {
                        "product_id": 12345,
                        "title": "Nike Air Zoom Pegasus 38",
                        "brand": "Nike",
                        "category": "Sports & Outdoors",
                        "price": 119.99,
                        "imgUrl": "https://example.com/image.jpg",
                        "position": {"x": 2.45, "y": -1.32, "z": 3.87},
                        "similarity_score": 0.89,
                    }
                ],
                "dimension_info": {
                    "original_dimensions": 512,
                    "reduced_dimensions": 3,
                    "method": "UMAP",
                    "centered_at_origin": True,
                },
            }
        }
