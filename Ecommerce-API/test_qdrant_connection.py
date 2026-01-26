"""
Quick test to verify Qdrant connection
"""

from qdrant_client import QdrantClient

try:
    # Connect to Qdrant
    client = QdrantClient(host="localhost", port=6333)
    
    # Get collections info
    collections = client.get_collections()
    
    print("✅ Successfully connected to Qdrant!")
    print(f"📊 Current collections: {len(collections.collections)}")
    
    if collections.collections:
        for col in collections.collections:
            print(f"   - {col.name}")
    else:
        print("   - No collections yet")
        
except Exception as e:
    print(f"❌ Failed to connect to Qdrant: {e}")
