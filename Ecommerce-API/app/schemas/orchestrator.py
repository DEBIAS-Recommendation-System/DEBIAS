"""
Orchestrator Schemas
Request and response models for the orchestrated recommendation system
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class RecommendationModeEnum(str, Enum):
    """User recommendation mode"""
    BROWSING = "browsing"
    POST_PURCHASE = "post_purchase"
    COLD_START = "cold_start"


class RecommendationSourceEnum(str, Enum):
    """Source of a recommendation"""
    BEHAVIORAL = "behavioral"
    TRENDING = "trending"
    SEMANTIC_SIMILAR = "semantic_similar"
    COMPLEMENTARY = "complementary"
    HYBRID = "hybrid"


class OrchestratedRecommendationItem(BaseModel):
    """A single recommendation from the orchestrator"""
    
    product_id: int = Field(..., description="Product ID")
    score: float = Field(..., description="Relevance/confidence score")
    source: RecommendationSourceEnum = Field(..., description="Source of recommendation")
    reason: Optional[str] = Field(None, description="Human-readable explanation")
    payload: Optional[Dict[str, Any]] = Field(
        None, 
        description="Additional product metadata from Qdrant (title, brand, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 12345,
                "score": 0.89,
                "source": "semantic_similar",
                "reason": "Similar to recently viewed item",
                "payload": {
                    "title": "Wireless Gaming Mouse",
                    "brand": "Logitech",
                    "category": "Electronics"
                }
            }
        }


class OrchestratedRecommendationRequest(BaseModel):
    """Request for orchestrated recommendations"""
    
    user_id: int = Field(..., description="User ID to get recommendations for")
    total_limit: int = Field(
        20, 
        ge=1, 
        le=100, 
        description="Total number of recommendations to return"
    )
    behavioral_weight: float = Field(
        0.3,
        ge=0.0,
        le=1.0,
        description="Weight for behavioral/collaborative filtering recommendations"
    )
    trending_weight: float = Field(
        0.2,
        ge=0.0,
        le=1.0,
        description="Weight for trending/popular items"
    )
    activity_weight: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Weight for recent activity based recommendations"
    )
    mmr_diversity: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Diversity for semantic search (0=relevance, 1=diversity). Higher values show more varied products while browsing."
    )
    include_reasons: bool = Field(
        True,
        description="Include human-readable explanation for each recommendation"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "total_limit": 20,
                "behavioral_weight": 0.3,
                "trending_weight": 0.2,
                "activity_weight": 0.5,
                "mmr_diversity": 0.7,
                "include_reasons": True
            }
        }


class OrchestratedRecommendationResponse(BaseModel):
    """Response containing orchestrated recommendations"""
    
    user_id: int = Field(..., description="User ID")
    mode: RecommendationModeEnum = Field(
        ..., 
        description="Current recommendation mode based on user state"
    )
    mode_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Context about the mode (e.g., last purchased product for post-purchase)"
    )
    total_count: int = Field(..., description="Number of recommendations returned")
    sources_used: List[str] = Field(
        ...,
        description="List of recommendation sources that contributed results"
    )
    strategy: str = Field(
        ...,
        description="Human-readable description of the recommendation strategy being used"
    )
    recommendations: List[OrchestratedRecommendationItem] = Field(
        ...,
        description="List of recommendations from multiple sources"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "mode": "browsing",
                "mode_context": {"recent_interactions": 15},
                "total_count": 20,
                "sources_used": ["behavioral", "trending", "semantic_similar"],
                "strategy": "Exploring mode: Using semantic search with high diversity...",
                "recommendations": [
                    {
                        "product_id": 12345,
                        "score": 0.89,
                        "source": "semantic_similar",
                        "reason": "Similar to recently viewed item"
                    }
                ]
            }
        }


class ForYouPageRequest(BaseModel):
    """Request for the For You page"""
    
    user_id: int = Field(..., description="User ID")
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=50, description="Items per page")
    mmr_diversity: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Diversity for semantic search"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "page": 1,
                "page_size": 20,
                "mmr_diversity": 0.7
            }
        }


class ForYouPageResponse(BaseModel):
    """Response for the For You page with pagination"""
    
    user_id: int = Field(..., description="User ID")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    has_more: bool = Field(..., description="Whether more pages are available")
    mode: RecommendationModeEnum = Field(..., description="Current recommendation mode")
    strategy: str = Field(..., description="Recommendation strategy description")
    recommendations: List[OrchestratedRecommendationItem] = Field(
        ...,
        description="Recommendations for this page"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "page": 1,
                "page_size": 20,
                "has_more": True,
                "mode": "browsing",
                "strategy": "Exploring mode...",
                "recommendations": []
            }
        }


class UserModeResponse(BaseModel):
    """Response indicating user's current recommendation mode"""
    
    user_id: int = Field(..., description="User ID")
    mode: RecommendationModeEnum = Field(..., description="Current recommendation mode")
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context about the mode"
    )
    strategy_description: str = Field(
        ...,
        description="Description of what this mode means"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "mode": "post_purchase",
                "context": {
                    "has_purchase": True,
                    "last_purchased_product_id": 456,
                    "purchase_time": "2026-01-30 10:30:00"
                },
                "strategy_description": "Post-purchase mode: Showing complementary products..."
            }
        }


class SimilarToRecentRequest(BaseModel):
    """Request for products similar to recent activity"""
    
    user_id: int = Field(..., description="User ID")
    limit: int = Field(10, ge=1, le=50, description="Maximum recommendations")
    use_mmr: bool = Field(True, description="Use MMR for diversity")
    mmr_diversity: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Diversity parameter"
    )
    exclude_product_ids: Optional[List[int]] = Field(
        None,
        description="Product IDs to exclude from results"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "limit": 10,
                "use_mmr": True,
                "mmr_diversity": 0.7,
                "exclude_product_ids": [100, 200, 300]
            }
        }


class ComplementaryRequest(BaseModel):
    """Request for complementary products after a purchase"""
    
    user_id: int = Field(..., description="User ID")
    purchased_product_id: int = Field(..., description="The product that was purchased")
    limit: int = Field(10, ge=1, le=50, description="Maximum recommendations")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "purchased_product_id": 456,
                "limit": 10
            }
        }
