"""
Test suite for the Orchestrator Service
Tests recommendation orchestration, mode detection, and source combination
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import List, Dict, Any

from app.services.orchestrator_service import (
    OrchestratorService,
    RecommendationMode,
    RecommendationSource,
    get_orchestrator_service
)


class TestOrchestratorService:
    """Test OrchestratorService functionality"""
    
    @pytest.fixture
    def mock_neo4j_service(self):
        """Create a mock Neo4j service"""
        mock = Mock()
        # Default responses
        mock.has_recent_purchase.return_value = {"has_purchase": False}
        mock.get_user_history.return_value = [{"product_id": 1}, {"product_id": 2}]
        mock.get_collaborative_recommendations.return_value = [
            {"product_id": 10, "total_score": 0.9, "recommender_count": 5},
            {"product_id": 11, "total_score": 0.8, "recommender_count": 3}
        ]
        mock.get_trending_products.return_value = [
            {"product_id": 20, "total_interactions": 100, "unique_users": 50},
            {"product_id": 21, "total_interactions": 90, "unique_users": 45}
        ]
        mock.get_recent_viewed_products.return_value = [
            {"product_id": 1}, {"product_id": 2}
        ]
        mock.get_user_purchase_history.return_value = []
        mock.get_complementary_products.return_value = [
            {"product_id": 30, "score": 0.85, "buyer_count": 20},
            {"product_id": 31, "score": 0.75, "buyer_count": 15}
        ]
        return mock
    
    @pytest.fixture
    def mock_qdrant_service(self):
        """Create a mock Qdrant service"""
        mock = Mock()
        mock.client = Mock()
        mock.text_embedding_model = Mock()
        
        # Mock retrieve response
        mock_point = Mock()
        mock_point.vector = [0.1, 0.2, 0.3]  # Example vector
        mock.client.retrieve.return_value = [mock_point]
        
        # Mock search response
        mock.search.return_value = [
            {
                "id": 40,
                "score": 0.95,
                "payload": {"title": "Similar Product 1", "price": 29.99}
            },
            {
                "id": 41,
                "score": 0.88,
                "payload": {"title": "Similar Product 2", "price": 39.99}
            }
        ]
        return mock
    
    @pytest.fixture
    def orchestrator(self, mock_neo4j_service, mock_qdrant_service):
        """Create orchestrator with mocked services"""
        return OrchestratorService(
            neo4j_service=mock_neo4j_service,
            qdrant_service=mock_qdrant_service
        )
    
    def test_initialization(self, orchestrator, mock_neo4j_service, mock_qdrant_service):
        """Test orchestrator initialization"""
        assert orchestrator._neo4j_service == mock_neo4j_service
        assert orchestrator._qdrant_service == mock_qdrant_service
    
    def test_lazy_neo4j_initialization(self):
        """Test lazy initialization of Neo4j service"""
        with patch('app.services.orchestrator_service.get_neo4j_service') as mock_get:
            mock_service = Mock()
            mock_get.return_value = mock_service
            
            orchestrator = OrchestratorService()
            neo4j = orchestrator.neo4j
            
            assert neo4j == mock_service
            mock_get.assert_called_once()
    
    def test_determine_user_mode_browsing(self, orchestrator, mock_neo4j_service):
        """Test mode detection for browsing user"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        mode, context = orchestrator.determine_user_mode(user_id=1)
        
        assert mode == RecommendationMode.BROWSING
        assert context == {"recent_interactions": 1}
        mock_neo4j_service.has_recent_purchase.assert_called_once_with(1, 24)
    
    def test_determine_user_mode_post_purchase(self, orchestrator, mock_neo4j_service):
        """Test mode detection for post-purchase user"""
        mock_neo4j_service.has_recent_purchase.return_value = {
            "has_purchase": True,
            "last_purchased_product_id": 123
        }
        
        mode, context = orchestrator.determine_user_mode(user_id=1)
        
        assert mode == RecommendationMode.POST_PURCHASE
        assert context["has_purchase"] is True
        assert context["last_purchased_product_id"] == 123
    
    def test_determine_user_mode_cold_start(self, orchestrator, mock_neo4j_service):
        """Test mode detection for new user (cold start)"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = []
        
        mode, context = orchestrator.determine_user_mode(user_id=1)
        
        assert mode == RecommendationMode.COLD_START
        assert context is None
    
    def test_determine_user_mode_error_handling(self, orchestrator, mock_neo4j_service):
        """Test mode detection error handling"""
        mock_neo4j_service.has_recent_purchase.side_effect = Exception("Database error")
        
        mode, context = orchestrator.determine_user_mode(user_id=1)
        
        assert mode == RecommendationMode.COLD_START
        assert context is None
    
    def test_get_behavioral_recommendations(self, orchestrator, mock_neo4j_service):
        """Test getting behavioral recommendations"""
        recommendations = orchestrator.get_behavioral_recommendations(user_id=1, limit=10)
        
        assert len(recommendations) == 2
        assert recommendations[0]["product_id"] == 10
        assert recommendations[0]["score"] == 0.9
        assert recommendations[0]["source"] == RecommendationSource.BEHAVIORAL
        assert "5 similar users" in recommendations[0]["reason"]
        
        mock_neo4j_service.get_collaborative_recommendations.assert_called_once_with(
            user_id=1, limit=10, min_shared_products=1
        )
    
    def test_get_behavioral_recommendations_error(self, orchestrator, mock_neo4j_service):
        """Test behavioral recommendations error handling"""
        mock_neo4j_service.get_collaborative_recommendations.side_effect = Exception("Error")
        
        recommendations = orchestrator.get_behavioral_recommendations(user_id=1)
        
        assert recommendations == []
    
    def test_get_trending_items(self, orchestrator, mock_neo4j_service):
        """Test getting trending items"""
        recommendations = orchestrator.get_trending_items(limit=10)
        
        assert len(recommendations) == 2
        assert recommendations[0]["product_id"] == 20
        assert recommendations[0]["score"] == 100
        assert recommendations[0]["source"] == RecommendationSource.TRENDING
        assert "50 users" in recommendations[0]["reason"]
        
        mock_neo4j_service.get_trending_products.assert_called_once_with(
            limit=10, event_types=None
        )
    
    def test_get_trending_items_with_filter(self, orchestrator, mock_neo4j_service):
        """Test getting trending items with event type filter"""
        orchestrator.get_trending_items(limit=5, event_types=["purchase"])
        
        mock_neo4j_service.get_trending_products.assert_called_once_with(
            limit=5, event_types=["purchase"]
        )
    
    def test_get_similar_to_recent_activity(self, orchestrator, mock_neo4j_service, mock_qdrant_service):
        """Test getting similar products to recent activity"""
        recommendations = orchestrator.get_similar_to_recent_activity(
            user_id=1, limit=10, use_mmr=True, mmr_diversity=0.7
        )
        
        assert len(recommendations) > 0
        assert recommendations[0]["product_id"] == 40
        assert recommendations[0]["source"] == RecommendationSource.SEMANTIC_SIMILAR
        assert "recently viewed" in recommendations[0]["reason"]
        
        mock_neo4j_service.get_recent_viewed_products.assert_called_once_with(1, limit=5)
        mock_qdrant_service.client.retrieve.assert_called()
        mock_qdrant_service.search.assert_called()
    
    def test_get_similar_to_recent_activity_no_history(self, orchestrator, mock_neo4j_service):
        """Test similar products with no user history"""
        mock_neo4j_service.get_recent_viewed_products.return_value = []
        
        recommendations = orchestrator.get_similar_to_recent_activity(user_id=1)
        
        assert recommendations == []
    
    def test_get_similar_to_recent_activity_with_exclusions(
        self, orchestrator, mock_neo4j_service, mock_qdrant_service
    ):
        """Test similar products with exclusions"""
        recommendations = orchestrator.get_similar_to_recent_activity(
            user_id=1, limit=10, exclude_product_ids=[40, 41]
        )
        
        # Should exclude the products returned by mock search
        assert len(recommendations) == 0  # Both results excluded
    
    def test_get_complementary_products(self, orchestrator, mock_neo4j_service):
        """Test getting complementary products"""
        recommendations = orchestrator.get_complementary_products(
            purchased_product_id=100, user_id=1, limit=10
        )
        
        assert len(recommendations) == 2
        assert recommendations[0]["product_id"] == 30
        assert recommendations[0]["source"] == RecommendationSource.COMPLEMENTARY
        assert "20 buyers" in recommendations[0]["reason"]
        
        mock_neo4j_service.get_user_purchase_history.assert_called_once_with(1, limit=50)
        mock_neo4j_service.get_complementary_products.assert_called()
    
    def test_get_complementary_products_with_exclusions(self, orchestrator, mock_neo4j_service):
        """Test complementary products excluding already purchased"""
        mock_neo4j_service.get_user_purchase_history.return_value = [{"product_id": 30}]
        
        recommendations = orchestrator.get_complementary_products(
            purchased_product_id=100, user_id=1, limit=10
        )
        
        # Product 30 should be excluded
        assert len(recommendations) == 1
        assert recommendations[0]["product_id"] == 31
    
    def test_get_orchestrated_recommendations_browsing_mode(
        self, orchestrator, mock_neo4j_service, mock_qdrant_service
    ):
        """Test orchestrated recommendations in browsing mode"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=1, total_limit=20
        )
        
        assert result["user_id"] == 1
        assert result["mode"] == RecommendationMode.BROWSING
        assert result["total_count"] > 0
        assert RecommendationSource.BEHAVIORAL.value in result["sources_used"]
        assert RecommendationSource.TRENDING.value in result["sources_used"]
        assert "Exploring mode" in result["strategy"]
        
        # Should have recommendations from multiple sources
        recommendations = result["recommendations"]
        assert len(recommendations) > 0
        assert any(r["source"] == RecommendationSource.BEHAVIORAL for r in recommendations)
    
    def test_get_orchestrated_recommendations_post_purchase_mode(
        self, orchestrator, mock_neo4j_service
    ):
        """Test orchestrated recommendations in post-purchase mode"""
        mock_neo4j_service.has_recent_purchase.return_value = {
            "has_purchase": True,
            "last_purchased_product_id": 123
        }
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=1, total_limit=20
        )
        
        assert result["mode"] == RecommendationMode.POST_PURCHASE
        assert RecommendationSource.COMPLEMENTARY.value in result["sources_used"]
        assert "Post-purchase mode" in result["strategy"]
    
    def test_get_orchestrated_recommendations_cold_start_mode(
        self, orchestrator, mock_neo4j_service
    ):
        """Test orchestrated recommendations in cold start mode"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = []
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=1, total_limit=20
        )
        
        assert result["mode"] == RecommendationMode.COLD_START
        assert RecommendationSource.TRENDING.value in result["sources_used"]
        assert "New user mode" in result["strategy"]
    
    def test_get_orchestrated_recommendations_deduplication(
        self, orchestrator, mock_neo4j_service, mock_qdrant_service
    ):
        """Test that orchestrated recommendations deduplicate products"""
        # Make behavioral and trending return the same product
        mock_neo4j_service.get_collaborative_recommendations.return_value = [
            {"product_id": 10, "total_score": 0.9, "recommender_count": 5}
        ]
        mock_neo4j_service.get_trending_products.return_value = [
            {"product_id": 10, "total_interactions": 100, "unique_users": 50}
        ]
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        result = orchestrator.get_orchestrated_recommendations(user_id=1, total_limit=20)
        
        product_ids = [r["product_id"] for r in result["recommendations"]]
        # Should only have product 10 once
        assert product_ids.count(10) == 1
    
    def test_get_orchestrated_recommendations_without_reasons(self, orchestrator, mock_neo4j_service):
        """Test orchestrated recommendations without reasons"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=1, total_limit=20, include_reasons=False
        )
        
        recommendations = result["recommendations"]
        if recommendations:
            assert "reason" not in recommendations[0]
    
    def test_get_orchestrated_recommendations_custom_weights(
        self, orchestrator, mock_neo4j_service
    ):
        """Test orchestrated recommendations with custom weights"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=1,
            total_limit=20,
            behavioral_weight=0.5,
            trending_weight=0.3,
            activity_weight=0.2
        )
        
        assert result["total_count"] > 0
        # Verify it runs without errors with custom weights
    
    def test_get_for_you_page(self, orchestrator, mock_neo4j_service, mock_qdrant_service):
        """Test paginated For You page"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        result = orchestrator.get_for_you_page(
            user_id=1, page=1, page_size=10
        )
        
        assert result["user_id"] == 1
        assert result["page"] == 1
        assert result["page_size"] == 10
        assert "has_more" in result
        assert "mode" in result
        assert "strategy" in result
        assert len(result["recommendations"]) <= 10
    
    def test_get_for_you_page_second_page(self, orchestrator, mock_neo4j_service, mock_qdrant_service):
        """Test second page of For You recommendations"""
        mock_neo4j_service.has_recent_purchase.return_value = {"has_purchase": False}
        mock_neo4j_service.get_user_history.return_value = [{"product_id": 1}]
        
        # Create enough mock data for pagination
        mock_neo4j_service.get_collaborative_recommendations.return_value = [
            {"product_id": i, "total_score": 0.9 - (i * 0.01), "recommender_count": 5}
            for i in range(10, 25)
        ]
        
        result = orchestrator.get_for_you_page(
            user_id=1, page=2, page_size=5
        )
        
        assert result["page"] == 2
        # Recommendations should start from index 5 (page 2, size 5)
    
    def test_singleton_get_orchestrator_service(self):
        """Test singleton pattern for get_orchestrator_service"""
        service1 = get_orchestrator_service()
        service2 = get_orchestrator_service()
        
        assert service1 is service2  # Same instance
    
    def test_strategy_descriptions(self, orchestrator):
        """Test strategy description generation"""
        browsing_desc = orchestrator._get_strategy_description(RecommendationMode.BROWSING)
        assert "Exploring mode" in browsing_desc
        
        post_purchase_desc = orchestrator._get_strategy_description(RecommendationMode.POST_PURCHASE)
        assert "Post-purchase mode" in post_purchase_desc
        
        cold_start_desc = orchestrator._get_strategy_description(RecommendationMode.COLD_START)
        assert "New user mode" in cold_start_desc


class TestRecommendationEnums:
    """Test recommendation enums"""
    
    def test_recommendation_mode_enum(self):
        """Test RecommendationMode enum values"""
        assert RecommendationMode.BROWSING == "browsing"
        assert RecommendationMode.POST_PURCHASE == "post_purchase"
        assert RecommendationMode.COLD_START == "cold_start"
    
    def test_recommendation_source_enum(self):
        """Test RecommendationSource enum values"""
        assert RecommendationSource.BEHAVIORAL == "behavioral"
        assert RecommendationSource.TRENDING == "trending"
        assert RecommendationSource.SEMANTIC_SIMILAR == "semantic_similar"
        assert RecommendationSource.COMPLEMENTARY == "complementary"
        assert RecommendationSource.HYBRID == "hybrid"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
