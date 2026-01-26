"""
Qdrant Vector Database Service
Handles connection to Qdrant and embedding operations
"""

from typing import List, Dict, Any, Optional, Union
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
from fastembed import TextEmbedding, ImageEmbedding
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class QdrantService:
    """
    Service class for managing Qdrant vector database operations
    """

    def __init__(self):
        """Initialize Qdrant client and embedding models"""
        self.client = None
        self.text_embedding_model = None
        self.image_embedding_model = None
        self.collection_name = settings.qdrant_collection_name
        self.vector_size = 512  # Default for CLIP models (works for both text and image)

    def connect(self):
        """Establish connection to Qdrant database"""
        try:
            if settings.qdrant_api_key:
                # Connect to Qdrant Cloud
                self.client = QdrantClient(
                    url=f"https://{settings.qdrant_host}",
                    api_key=settings.qdrant_api_key,
                )
            else:
                # Connect to local Qdrant instance
                self.client = QdrantClient(
                    host=settings.qdrant_host,
                    port=settings.qdrant_port,
                )
            
            logger.info(f"Connected to Qdrant at {settings.qdrant_host}:{settings.qdrant_port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise

    def initialize_text_embedding_model(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize the FastEmbed text model for embeddings (SENTENCE-BERT)
        
        Args:
            model_name: Name of the FastEmbed text model to use
                       Options:
                       - sentence-transformers/all-MiniLM-L6-v2 (384d) - Fast & lightweight
                       - sentence-transformers/all-mpnet-base-v2 (768d) - More accurate
                       - sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384d) - Multilingual
        """
        try:
            self.text_embedding_model = TextEmbedding(model_name=model_name)
            # Set vector size based on model
            if "MiniLM" in model_name or "multilingual" in model_name:
                self.vector_size = 384
            elif "mpnet" in model_name or "base" in model_name:
                self.vector_size = 768
            else:
                self.vector_size = 384  # Default
            logger.info(f"Initialized text embedding model: {model_name} (dimension: {self.vector_size})")
        except Exception as e:
            logger.error(f"Failed to initialize text embedding model: {str(e)}")
            raise

    def initialize_image_embedding_model(self, model_name: str = "Qdrant/clip-ViT-B-32-vision"):
        """
        Initialize the FastEmbed image model for embeddings
        
        Args:
            model_name: Name of the FastEmbed image model to use
                       Options: 
                       - Qdrant/clip-ViT-B-32-vision (512 dim)
                       - Qdrant/clip-ViT-B-16-vision (512 dim)
                       - Qdrant/Unicom-ViT-B-16 (768 dim)
        """
        try:
            self.image_embedding_model = ImageEmbedding(model_name=model_name)
            # CLIP models typically use 512 dimensions
            if "ViT-B-32" in model_name or "ViT-B-16" in model_name:
                self.vector_size = 512
            elif "Unicom" in model_name:
                self.vector_size = 768
            else:
                self.vector_size = 512  # Default for CLIP
            logger.info(f"Initialized image embedding model: {model_name} (dimension: {self.vector_size})")
        except Exception as e:
            logger.error(f"Failed to initialize image embedding model: {str(e)}")
            raise

    def initialize_multimodal_models(self, text_model: str = "Qdrant/clip-ViT-B-32-text", 
                                     image_model: str = "Qdrant/clip-ViT-B-32-vision"):
        """
        Initialize both text and image CLIP models for multimodal embeddings
        Both models must use the same CLIP variant for compatible embeddings
        
        Args:
            text_model: CLIP text model name
            image_model: CLIP vision model name (must match text model variant)
        """
        try:
            self.text_embedding_model = TextEmbedding(model_name=text_model)
            self.image_embedding_model = ImageEmbedding(model_name=image_model)
            self.vector_size = 512  # CLIP models use 512 dimensions
            logger.info(f"Initialized multimodal models: {text_model} + {image_model} (dimension: {self.vector_size})")
        except Exception as e:
            logger.error(f"Failed to initialize multimodal models: {str(e)}")
            raise

    def create_collection(self, collection_name: Optional[str] = None, vector_size: Optional[int] = None):
        """
        Create a new collection in Qdrant
        
        Args:
            collection_name: Name of the collection (uses default if not provided)
            vector_size: Size of the vectors (uses model dimension if not provided)
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name
        vector_size = vector_size or self.vector_size

        try:
            # Check if collection already exists
            collections = self.client.get_collections().collections
            if any(col.name == collection_name for col in collections):
                logger.info(f"Collection '{collection_name}' already exists")
                return

            # Create new collection
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            logger.info(f"Created collection '{collection_name}' with vector size {vector_size}")
        except Exception as e:
            logger.error(f"Failed to create collection: {str(e)}")
            raise

    def create_text_embedding(self, text: str) -> List[float]:
        """
        Create an embedding vector from text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if not self.text_embedding_model:
            self.initialize_text_embedding_model()

        try:
            # FastEmbed returns a generator, get first result
            embeddings = list(self.text_embedding_model.embed([text]))
            return embeddings[0].tolist()
        except Exception as e:
            logger.error(f"Failed to create text embedding: {str(e)}")
            raise

    def create_image_embedding(self, image_path: str) -> List[float]:
        """
        Create an embedding vector from an image
        
        Args:
            image_path: Path to the image file (local path or URL)
            
        Returns:
            List of floats representing the embedding vector
        """
        if not self.image_embedding_model:
            self.initialize_image_embedding_model()

        try:
            # FastEmbed returns a generator, get first result
            embeddings = list(self.image_embedding_model.embed([image_path]))
            return embeddings[0].tolist()
        except Exception as e:
            logger.error(f"Failed to create image embedding: {str(e)}")
            raise

    def create_text_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embedding vectors for multiple texts
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not self.text_embedding_model:
            self.initialize_text_embedding_model()

        try:
            # FastEmbed's embed method is already efficient for batches
            embeddings = list(self.text_embedding_model.embed(texts))
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Failed to create batch text embeddings: {str(e)}")
            raise

    def create_image_embeddings_batch(self, image_paths: List[str]) -> List[List[float]]:
        """
        Create embedding vectors for multiple images
        
        Args:
            image_paths: List of image file paths (local paths or URLs)
            
        Returns:
            List of embedding vectors
        """
        if not self.image_embedding_model:
            self.initialize_image_embedding_model()

        try:
            # FastEmbed's embed method is already efficient for batches
            embeddings = list(self.image_embedding_model.embed(image_paths))
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Failed to create batch image embeddings: {str(e)}")
            raise

    def insert_point(
        self,
        point_id: int,
        text: Optional[str] = None,
        image_path: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        collection_name: Optional[str] = None
    ) -> bool:
        """
        Insert a single point with embedding into Qdrant
        Can embed text, image, or both (for multimodal)
        
        Args:
            point_id: Unique identifier for the point
            text: Text to embed (optional)
            image_path: Path to image to embed (optional)
            payload: Additional metadata to store with the point
            collection_name: Name of the collection (uses default if not provided)
            
        Returns:
            True if successful
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name
        payload = payload or {}
        
        if text:
            payload["text"] = text
        if image_path:
            payload["image_path"] = image_path

        try:
            # Determine which embedding to create
            if text and image_path:
                # Use image embedding for multimodal (text stored as metadata)
                vector = self.create_image_embedding(image_path)
            elif image_path:
                vector = self.create_image_embedding(image_path)
            elif text:
                vector = self.create_text_embedding(text)
            else:
                raise ValueError("Either text or image_path must be provided")

            # Insert point
            self.client.upsert(
                collection_name=collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
            logger.info(f"Inserted point {point_id} into collection '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to insert point: {str(e)}")
            raise

    def insert_points_batch(
        self,
        points: List[Dict[str, Any]],
        collection_name: Optional[str] = None
    ) -> bool:
        """
        Insert multiple points with embeddings into Qdrant
        Points can contain 'text', 'image_path', 'vector', or pre-computed 'vector'
        
        Args:
            points: List of dicts with keys: id, and one of (text, image_path, or vector), plus optional payload
            collection_name: Name of the collection (uses default if not provided)
            
        Returns:
            True if successful
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name

        try:
            # Create point structures
            point_structs = []
            for point in points:
                # Use pre-computed vector if available, otherwise create embedding
                if "vector" in point:
                    vector = point["vector"]
                elif "image_path" in point:
                    vector = self.create_image_embedding(point["image_path"])
                elif "text" in point:
                    vector = self.create_text_embedding(point["text"])
                else:
                    raise ValueError(f"Point {point.get('id')} must have 'vector', 'text', or 'image_path'")
                
                payload = point.get("payload", {})
                if "text" in point:
                    payload["text"] = point["text"]
                if "image_path" in point:
                    payload["image_path"] = point["image_path"]
                
                point_structs.append(
                    PointStruct(
                        id=point["id"],
                        vector=vector,
                        payload=payload
                    )
                )

            # Insert points
            self.client.upsert(
                collection_name=collection_name,
                points=point_structs
            )
            logger.info(f"Inserted {len(points)} points into collection '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to insert batch points: {str(e)}")
            raise

    def search(
        self,
        query_text: Optional[str] = None,
        query_image: Optional[str] = None,
        query_vector: Optional[List[float]] = None,
        limit: int = 5,
        score_threshold: Optional[float] = None,
        collection_name: Optional[str] = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in Qdrant
        Can search by text, image, or pre-computed vector
        
        Args:
            query_text: Text to search for
            query_image: Image path to search for
            query_vector: Pre-computed query vector
            limit: Maximum number of results to return
            score_threshold: Minimum similarity score (0-1)
            collection_name: Name of the collection (uses default if not provided)
            filter_conditions: Optional filters to apply
            
        Returns:
            List of search results with id, score, and payload
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name

        try:
            # Create query embedding
            if query_vector is not None:
                pass  # Use provided vector
            elif query_image:
                query_vector = self.create_image_embedding(query_image)
            elif query_text:
                query_vector = self.create_text_embedding(query_text)
            else:
                raise ValueError("Must provide query_text, query_image, or query_vector")

            # Prepare filter if provided
            query_filter = None
            if filter_conditions:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                        for key, value in filter_conditions.items()
                    ]
                )

            # Search
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter
            )

            # Format results
            formatted_results = [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                }
                for hit in results
            ]

            logger.info(f"Found {len(formatted_results)} results for query")
            return formatted_results
        except Exception as e:
            logger.error(f"Failed to search: {str(e)}")
            raise

    def delete_point(self, point_id: int, collection_name: Optional[str] = None) -> bool:
        """
        Delete a point from Qdrant
        
        Args:
            point_id: ID of the point to delete
            collection_name: Name of the collection (uses default if not provided)
            
        Returns:
            True if successful
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name

        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=[point_id]
            )
            logger.info(f"Deleted point {point_id} from collection '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to delete point: {str(e)}")
            raise

    def get_collection_info(self, collection_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a collection
        
        Args:
            collection_name: Name of the collection (uses default if not provided)
            
        Returns:
            Dictionary with collection information
        """
        if not self.client:
            self.connect()

        collection_name = collection_name or self.collection_name

        try:
            info = self.client.get_collection(collection_name=collection_name)
            return {
                "name": collection_name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {str(e)}")
            raise


# Singleton instance
qdrant_service = QdrantService()
