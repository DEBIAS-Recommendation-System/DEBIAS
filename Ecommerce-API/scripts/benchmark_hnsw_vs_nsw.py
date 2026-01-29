"""
Benchmark HNSW vs NSW for Filtered Searches

This script compares performance between:
1. HNSW (Hierarchical NSW - multi-layer graph, m=16)
2. NSW (Single-layer graph, m=4 or lower)

Research shows NSW can outperform HNSW for highly filtered e-commerce searches.

Usage:
    python scripts/benchmark_hnsw_vs_nsw.py --collection products
"""

import argparse
import json
import statistics
import sys
import time
from pathlib import Path
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
    HnswConfigDiff,
)
from app.core.config import settings


class HNSWvsNSWBenchmark:
    """Compare HNSW vs NSW performance for filtered searches"""

    def __init__(self, source_collection: str):
        self.source_collection = source_collection
        self.client = None
        self.results = {}
        self.sample_vectors = []
        self.test_collections = []

    def connect(self):
        """Connect to Qdrant"""
        print("🔌 Connecting to Qdrant...")
        self.client = QdrantClient(settings.qdrant_host, port=settings.qdrant_port)
        print("✅ Connected\n")

    def get_source_config(self):
        """Get configuration from source collection"""
        info = self.client.get_collection(self.source_collection)
        return {
            "vector_size": info.config.params.vectors.size,
            "distance": info.config.params.vectors.distance,
            "points_count": info.points_count,
        }

    def sample_vectors_and_data(self, count: int = 100):
        """Sample vectors and payloads from source collection"""
        print(f"📊 Sampling {count} points from {self.source_collection}...")
        
        points, _ = self.client.scroll(
            collection_name=self.source_collection,
            limit=count,
            with_vectors=True,
            with_payload=True,
        )
        
        self.sample_vectors = points
        print(f"✅ Sampled {len(points)} points\n")
        return points

    def create_test_collection(
        self, 
        name: str, 
        vector_size: int, 
        distance: Distance,
        m: int,
        ef_construct: int,
        description: str
    ):
        """Create a test collection with specific HNSW parameters"""
        print(f"🔧 Creating test collection: {name}")
        print(f"   Description: {description}")
        print(f"   Parameters: m={m}, ef_construct={ef_construct}")
        
        # Delete if exists
        try:
            self.client.delete_collection(name)
            print(f"   ℹ️  Deleted existing collection")
        except:
            pass
        
        # Create new collection
        self.client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=distance,
            ),
            hnsw_config=HnswConfigDiff(
                m=m,
                ef_construct=ef_construct,
                full_scan_threshold=10000,
            ),
        )
        
        print(f"   ✅ Collection created\n")
        self.test_collections.append(name)
        return name

    def populate_test_collection(self, collection_name: str):
        """Populate test collection with sampled data in batches"""
        print(f"📥 Populating {collection_name} with {len(self.sample_vectors)} points...")
        
        points = []
        for point in self.sample_vectors:
            points.append({
                "id": point.id,
                "vector": point.vector,
                "payload": point.payload,
            })
        
        # Upload in batches of 100 to avoid broken pipe
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=collection_name,
                points=batch,
            )
            if (i + batch_size) % 1000 == 0 or i + batch_size >= len(points):
                print(f"   📊 Uploaded {min(i + batch_size, len(points))}/{len(points)} points...")
        
        print(f"   ✅ Populated {len(points)} points\n")

    def create_payload_indexes(self, collection_name: str):
        """Create payload indexes for category field"""
        print(f"🔍 Creating payload indexes for {collection_name}...")
        
        from qdrant_client.models import PayloadSchemaType
        
        self.client.create_payload_index(
            collection_name=collection_name,
            field_name="category",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        
        print(f"   ✅ Indexes created\n")

    def get_sample_categories(self, collection_name: str) -> List[str]:
        """Get sample category values"""
        points, _ = self.client.scroll(
            collection_name=collection_name,
            limit=100,
            with_payload=True,
        )
        
        categories = set()
        for point in points:
            if point.payload and 'category' in point.payload:
                categories.add(point.payload['category'])
        
        return list(categories)[:3]

    def run_search_benchmark(
        self,
        collection_name: str,
        test_name: str,
        filter_obj: Filter = None,
        iterations: int = 30,
    ) -> Dict:
        """Run search benchmark on a collection"""
        latencies = []
        result_counts = []
        errors = 0

        # Use subset of sample vectors for search queries
        search_samples = self.sample_vectors[:min(iterations, len(self.sample_vectors))]

        for i in range(iterations):
            try:
                sample = search_samples[i % len(search_samples)]
                vector = sample.vector
                
                start_time = time.time()
                results = self.client.query_points(
                    collection_name=collection_name,
                    query=vector,
                    query_filter=filter_obj,
                    limit=10,
                ).points
                elapsed_ms = (time.time() - start_time) * 1000

                latencies.append(elapsed_ms)
                result_counts.append(len(results))

            except Exception as e:
                errors += 1
                if errors == 1:  # Only print first error
                    print(f"   ⚠️  Error: {str(e)}")

        if not latencies:
            return None

        return {
            "test_name": test_name,
            "collection": collection_name,
            "iterations": len(latencies),
            "errors": errors,
            "mean_ms": statistics.mean(latencies),
            "median_ms": statistics.median(latencies),
            "p95_ms": (
                statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
            ),
            "std_ms": statistics.stdev(latencies) if len(latencies) > 1 else 0,
            "min_ms": min(latencies),
            "max_ms": max(latencies),
            "avg_results": statistics.mean(result_counts),
        }

    def benchmark_configurations(self, iterations: int = 30):
        """Benchmark different HNSW/NSW configurations"""
        print("=" * 70)
        print("📊 BENCHMARK: HNSW vs NSW for Filtered Searches")
        print("=" * 70)
        print()

        categories = self.get_sample_categories(self.test_collections[0])
        if not categories:
            print("⚠️  No categories found")
            return
        
        test_category = categories[0]
        print(f"📌 Test filter: category = '{test_category}'")
        print()

        category_filter = Filter(
            must=[FieldCondition(key="category", match=MatchValue(value=test_category))]
        )

        # Test each configuration
        all_results = []

        for collection in self.test_collections:
            print(f"🔍 Testing: {collection}")
            print()

            # No filter test
            print("   Test 1: No Filter (baseline)")
            result_no_filter = self.run_search_benchmark(
                collection_name=collection,
                test_name=f"{collection} - No Filter",
                filter_obj=None,
                iterations=iterations,
            )
            if result_no_filter:
                print(f"   ✅ Mean: {result_no_filter['mean_ms']:.2f}ms")

            # With filter test
            print()
            print(f"   Test 2: Category Filter ('{test_category}')")
            result_with_filter = self.run_search_benchmark(
                collection_name=collection,
                test_name=f"{collection} - Category Filter",
                filter_obj=category_filter,
                iterations=iterations,
            )
            if result_with_filter:
                print(f"   ✅ Mean: {result_with_filter['mean_ms']:.2f}ms")

            if result_no_filter and result_with_filter:
                speedup = result_no_filter["mean_ms"] / result_with_filter["mean_ms"]
                print(f"   📈 Filter speedup: {speedup:.2f}x")
            
            print()

            all_results.append({
                "collection": collection,
                "no_filter": result_no_filter,
                "with_filter": result_with_filter,
            })

        self.results["configurations"] = all_results

        # Comparison summary
        print("=" * 70)
        print("📊 COMPARISON SUMMARY")
        print("=" * 70)
        print()
        
        print(f"{'Configuration':<25} {'No Filter (ms)':<18} {'Filtered (ms)':<18} {'Speedup':<10}")
        print("-" * 70)
        
        for result in all_results:
            config_name = result["collection"]
            no_filter_ms = result["no_filter"]["mean_ms"] if result["no_filter"] else 0
            filtered_ms = result["with_filter"]["mean_ms"] if result["with_filter"] else 0
            speedup = no_filter_ms / filtered_ms if filtered_ms > 0 else 0
            
            print(f"{config_name:<25} {no_filter_ms:<18.2f} {filtered_ms:<18.2f} {speedup:<10.2f}x")

    def print_insights(self):
        """Print performance insights"""
        print()
        print("=" * 70)
        print("💡 INSIGHTS")
        print("=" * 70)
        print()

        if "configurations" not in self.results:
            return

        results = self.results["configurations"]
        
        # Find best performer for filtered searches
        filtered_results = [
            (r["collection"], r["with_filter"]["mean_ms"]) 
            for r in results 
            if r["with_filter"]
        ]
        
        if filtered_results:
            best = min(filtered_results, key=lambda x: x[1])
            worst = max(filtered_results, key=lambda x: x[1])
            
            improvement = (worst[1] - best[1]) / worst[1] * 100
            
            print(f"🏆 Best for Filtered Searches: {best[0]} ({best[1]:.2f}ms)")
            print(f"⚠️  Worst for Filtered Searches: {worst[0]} ({worst[1]:.2f}ms)")
            print(f"📊 Performance difference: {improvement:.1f}% improvement")
            print()
            
            # Determine if NSW or HNSW is better
            if "NSW" in best[0] or "m=4" in best[0]:
                print("✅ NSW (single-layer) performs better for filtered searches!")
                print("   This aligns with research showing simpler graph structures")
                print("   work better for highly selective filters.")
            elif "HNSW" in best[0] or "m=16" in best[0]:
                print("✅ HNSW (multi-layer) performs better for filtered searches!")
                print("   The hierarchical structure provides benefits even with filters.")
            print()

        print("🎯 Key Takeaways:")
        print("   • Lower m values (NSW-like) = simpler graph, potentially faster for filters")
        print("   • Higher m values (HNSW) = more connections, better for unfiltered search")
        print("   • Optimal configuration depends on your filter selectivity")
        print("   • Qdrant's query planner adapts strategy based on graph structure")

    def cleanup(self):
        """Delete test collections"""
        print()
        print("🧹 Cleaning up test collections...")
        for collection in self.test_collections:
            try:
                self.client.delete_collection(collection)
                print(f"   ✅ Deleted {collection}")
            except:
                pass

    def export_results(self, filepath: str):
        """Export results to JSON"""
        with open(filepath, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"\n📁 Results exported to: {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description="Benchmark HNSW vs NSW for filtered searches"
    )
    parser.add_argument(
        "--collection",
        type=str,
        required=True,
        help="Source collection to sample data from",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=30,
        help="Number of iterations per test (default: 30)",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=100,
        help="Number of points to sample (default: 100)",
    )
    parser.add_argument(
        "--export",
        type=str,
        help="Export results to JSON file",
    )
    parser.add_argument(
        "--keep-collections",
        action="store_true",
        help="Keep test collections after benchmark",
    )

    args = parser.parse_args()

    print("=" * 70)
    print("🚀 HNSW vs NSW BENCHMARK FOR FILTERED SEARCHES")
    print("=" * 70)
    print(f"Source collection: {args.collection}")
    print(f"Sample size: {args.sample_size}")
    print(f"Iterations per test: {args.iterations}")
    print("=" * 70)
    print()

    benchmark = HNSWvsNSWBenchmark(source_collection=args.collection)

    try:
        # Connect and get source configuration
        benchmark.connect()
        source_config = benchmark.get_source_config()
        
        print("📊 Source Collection Info:")
        print(f"   Points: {source_config['points_count']:,}")
        print(f"   Vector size: {source_config['vector_size']}")
        print(f"   Distance: {source_config['distance']}")
        print()

        # Sample data
        benchmark.sample_vectors_and_data(count=args.sample_size)

        # Create test collections with different configurations
        configs = [
            {
                "name": "test_hnsw_m16",
                "m": 16,
                "ef_construct": 100,
                "description": "Standard HNSW (multi-layer, high connectivity)",
            },
            {
                "name": "test_hnsw_m8",
                "m": 8,
                "ef_construct": 100,
                "description": "Medium HNSW (fewer layers, medium connectivity)",
            },
            {
                "name": "test_nsw_m2",
                "m": 2,
                "ef_construct": 100,
                "description": "Pure NSW (single-layer, minimal connectivity)",
            },
            {
                "name": "test_nsw_m1",
                "m": 1,
                "ef_construct": 100,
                "description": "Pure NSW (single-layer, absolute minimal connectivity)",
            },
        ]

        for config in configs:
            collection_name = benchmark.create_test_collection(
                name=config["name"],
                vector_size=source_config["vector_size"],
                distance=source_config["distance"],
                m=config["m"],
                ef_construct=config["ef_construct"],
                description=config["description"],
            )
            
            # Populate with data
            benchmark.populate_test_collection(collection_name)
            
            # Create payload indexes
            benchmark.create_payload_indexes(collection_name)

        # Run benchmarks
        benchmark.benchmark_configurations(iterations=args.iterations)

        # Print insights
        benchmark.print_insights()

        # Export if requested
        if args.export:
            benchmark.export_results(args.export)

        print()
        print("=" * 70)
        print("✅ Benchmark completed successfully!")
        print("=" * 70)

    except Exception as e:
        print(f"❌ Error during benchmark: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        # Cleanup unless requested to keep
        if not args.keep_collections:
            benchmark.cleanup()


if __name__ == "__main__":
    main()
