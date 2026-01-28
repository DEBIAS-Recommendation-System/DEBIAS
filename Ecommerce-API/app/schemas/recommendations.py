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

    class Config:
        json_schema_extra = {
            "example": {
                "query_text": "comfortable running shoes",
                "limit": 5,
                "score_threshold": 0.7,
                "filters": {"category": "Sports & Outdoors"},
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
