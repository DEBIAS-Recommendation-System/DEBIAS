"""Test orbit-view search functionality"""
from app.services.qdrant_service import qdrant_service

# Connect and initialize
qdrant_service.connect()
qdrant_service.initialize_multimodal_models()

# Test search WITHOUT MMR
print("Testing search WITHOUT MMR...")
results_no_mmr = qdrant_service.search(
    query_text='laptop',
    limit=20,
    score_threshold=0.3,
    collection_name='products',
    use_mmr=False,
)
print(f'Found {len(results_no_mmr)} results without MMR')

# Test search WITH MMR
print("\nTesting search WITH MMR...")
results_mmr = qdrant_service.search(
    query_text='laptop',
    limit=20,
    score_threshold=0.3,
    collection_name='products',
    use_mmr=True,
    mmr_diversity=0.5,
)
print(f'Found {len(results_mmr)} results with MMR')

# Test search WITH MMR but lower threshold
print("\nTesting search WITH MMR and lower threshold...")
results_mmr_low = qdrant_service.search(
    query_text='laptop',
    limit=20,
    score_threshold=0.1,
    collection_name='products',
    use_mmr=True,
    mmr_diversity=0.5,
)
print(f'Found {len(results_mmr_low)} results with MMR and 0.1 threshold')

# Test search WITH MMR and NO threshold
print("\nTesting search WITH MMR and NO threshold...")
results_mmr_none = qdrant_service.search(
    query_text='laptop',
    limit=20,
    score_threshold=None,
    collection_name='products',
    use_mmr=True,
    mmr_diversity=0.5,
)
print(f'Found {len(results_mmr_none)} results with MMR and no threshold')
