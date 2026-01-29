"""
Benchmark: With vs Without Payload Indexes

Compare performance of same configuration with/without payload indexes.

Usage:
    python scripts/benchmark_with_without_indexes.py --collection products --m-value 1
"""

import argparse
import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
    HnswConfigDiff,
    PayloadSchemaType,
)
from app.core.config import settings


def benchmark_with_without_indexes(m_value: int, iterations: int = 50):
    """Compare performance with and without payload indexes"""
    
    client = QdrantClient(settings.qdrant_host, port=settings.qdrant_port)
    
    # Get source collection info
    source_collection = "products"
    info = client.get_collection(source_collection)
    vector_size = info.config.params.vectors.size
    
    print("=" * 70)
    print(f"🔬 PAYLOAD INDEX IMPACT BENCHMARK (m={m_value})")
    print("=" * 70)
    print(f"Source: {source_collection}")
    print(f"Iterations: {iterations}")
    print("=" * 70)
    print()
    
    # Sample data
    print("📊 Sampling 1000 points...")
    points, _ = client.scroll(
        collection_name=source_collection,
        limit=1000,
        with_vectors=True,
        with_payload=True,
    )
    print(f"✅ Sampled {len(points)} points\n")
    
    # Get sample category
    categories = set()
    for point in points:
        if point.payload and 'category' in point.payload:
            categories.add(point.payload['category'])
    test_category = list(categories)[0]
    
    print(f"📌 Test filter: category = '{test_category}'\n")
    
    results = {}
    
    # Test 1: WITHOUT payload indexes
    print("=" * 70)
    print("🔍 TEST 1: WITHOUT Payload Indexes")
    print("=" * 70)
    
    collection_no_idx = f"test_m{m_value}_no_indexes"
    print(f"Creating {collection_no_idx}...")
    
    try:
        client.delete_collection(collection_no_idx)
    except:
        pass
    
    client.create_collection(
        collection_name=collection_no_idx,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        hnsw_config=HnswConfigDiff(m=m_value, ef_construct=100, full_scan_threshold=10000),
    )
    
    # Upload in batches
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = [{"id": p.id, "vector": p.vector, "payload": p.payload} for p in points[i:i+batch_size]]
        client.upsert(collection_name=collection_no_idx, points=batch)
    
    print(f"✅ Created and populated\n")
    
    # Benchmark without indexes
    category_filter = Filter(must=[FieldCondition(key="category", match=MatchValue(value=test_category))])
    
    latencies_no_idx = []
    for i in range(iterations):
        sample = points[i % len(points)]
        start = time.time()
        results_search = client.query_points(
            collection_name=collection_no_idx,
            query=sample.vector,
            query_filter=category_filter,
            limit=10,
        ).points
        latencies_no_idx.append((time.time() - start) * 1000)
    
    mean_no_idx = statistics.mean(latencies_no_idx)
    p95_no_idx = statistics.quantiles(latencies_no_idx, n=20)[18] if len(latencies_no_idx) >= 20 else max(latencies_no_idx)
    
    print(f"Results WITHOUT indexes:")
    print(f"   Mean:   {mean_no_idx:.2f}ms")
    print(f"   P95:    {p95_no_idx:.2f}ms")
    print()
    
    results["without_indexes"] = {
        "mean_ms": mean_no_idx,
        "p95_ms": p95_no_idx,
    }
    
    # Test 2: WITH payload indexes
    print("=" * 70)
    print("🔍 TEST 2: WITH Payload Indexes")
    print("=" * 70)
    
    collection_with_idx = f"test_m{m_value}_with_indexes"
    print(f"Creating {collection_with_idx}...")
    
    try:
        client.delete_collection(collection_with_idx)
    except:
        pass
    
    client.create_collection(
        collection_name=collection_with_idx,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        hnsw_config=HnswConfigDiff(m=m_value, ef_construct=100, full_scan_threshold=10000),
    )
    
    # Upload in batches
    for i in range(0, len(points), batch_size):
        batch = [{"id": p.id, "vector": p.vector, "payload": p.payload} for p in points[i:i+batch_size]]
        client.upsert(collection_name=collection_with_idx, points=batch)
    
    # Create payload index
    print("🔍 Creating payload index on 'category' field...")
    client.create_payload_index(
        collection_name=collection_with_idx,
        field_name="category",
        field_schema=PayloadSchemaType.KEYWORD,
    )
    
    print(f"✅ Created and populated with indexes\n")
    
    # Benchmark with indexes
    latencies_with_idx = []
    for i in range(iterations):
        sample = points[i % len(points)]
        start = time.time()
        results_search = client.query_points(
            collection_name=collection_with_idx,
            query=sample.vector,
            query_filter=category_filter,
            limit=10,
        ).points
        latencies_with_idx.append((time.time() - start) * 1000)
    
    mean_with_idx = statistics.mean(latencies_with_idx)
    p95_with_idx = statistics.quantiles(latencies_with_idx, n=20)[18] if len(latencies_with_idx) >= 20 else max(latencies_with_idx)
    
    print(f"Results WITH indexes:")
    print(f"   Mean:   {mean_with_idx:.2f}ms")
    print(f"   P95:    {p95_with_idx:.2f}ms")
    print()
    
    results["with_indexes"] = {
        "mean_ms": mean_with_idx,
        "p95_ms": p95_with_idx,
    }
    
    # Comparison
    print("=" * 70)
    print("📊 COMPARISON")
    print("=" * 70)
    print()
    
    speedup = mean_no_idx / mean_with_idx
    improvement_pct = (mean_no_idx - mean_with_idx) / mean_no_idx * 100
    
    print(f"Configuration: NSW m={m_value}")
    print()
    print(f"{'Metric':<25} {'Without Indexes':<20} {'With Indexes':<20} {'Improvement'}")
    print("-" * 70)
    print(f"{'Mean Latency':<25} {mean_no_idx:<20.2f} {mean_with_idx:<20.2f} {improvement_pct:+.1f}%")
    print(f"{'P95 Latency':<25} {p95_no_idx:<20.2f} {p95_with_idx:<20.2f} {(p95_no_idx - p95_with_idx) / p95_no_idx * 100:+.1f}%")
    print()
    print(f"🚀 Speedup: {speedup:.2f}x ({improvement_pct:.1f}% faster)")
    print()
    
    if speedup > 1.1:
        print("✅ Payload indexes provide significant benefit!")
    elif speedup > 1.0:
        print("✅ Payload indexes provide modest benefit")
    else:
        print("⚠️  Payload indexes add overhead (may indicate query planner already optimizing)")
    
    # Cleanup
    print()
    print("🧹 Cleaning up...")
    try:
        client.delete_collection(collection_no_idx)
        client.delete_collection(collection_with_idx)
        print("✅ Cleanup complete")
    except:
        pass
    
    print()
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Benchmark with/without payload indexes")
    parser.add_argument("--collection", type=str, default="products", help="Source collection")
    parser.add_argument("--m-value", type=int, default=1, help="HNSW m parameter (default: 1)")
    parser.add_argument("--iterations", type=int, default=50, help="Iterations per test")
    
    args = parser.parse_args()
    
    benchmark_with_without_indexes(m_value=args.m_value, iterations=args.iterations)


if __name__ == "__main__":
    main()
