"""
Benchmark Payload Indexes Using Existing Collection Data

This script benchmarks payload index performance using actual vectors
already in the collection, without needing to generate new embeddings.

Usage:
    python scripts/benchmark_existing_collection.py --collection products
    python scripts/benchmark_existing_collection.py --collection products --quick
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
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.core.config import settings


class ExistingCollectionBenchmark:
    """Benchmark suite using existing collection data"""

    def __init__(self, collection_name: str = None):
        self.collection_name = collection_name or settings.qdrant_collection_name
        self.client = None
        self.results = {}
        self.sample_vectors = []

    def connect(self):
        """Connect to Qdrant"""
        print("🔌 Connecting to Qdrant...")
        self.client = QdrantClient(settings.qdrant_host, port=settings.qdrant_port)
        print("✅ Connected\n")

    def get_collection_stats(self):
        """Get collection statistics"""
        info = self.client.get_collection(self.collection_name)
        return {
            "name": self.collection_name,
            "points_count": info.points_count,
            "status": info.status,
            "vector_size": info.config.params.vectors.size,
        }

    def sample_vectors_from_collection(self, count: int = 10):
        """Sample random vectors from the collection to use in searches"""
        print(f"📊 Sampling {count} vectors from collection...")
        
        # Scroll through collection to get sample vectors
        points, _ = self.client.scroll(
            collection_name=self.collection_name,
            limit=count,
            with_vectors=True,
            with_payload=True,
        )
        
        self.sample_vectors = points
        print(f"✅ Sampled {len(points)} vectors\n")
        return points

    def run_search_benchmark(
        self,
        test_name: str,
        filter_obj: Filter = None,
        iterations: int = 20,
    ) -> Dict:
        """Run a search benchmark using sampled vectors"""
        latencies = []
        result_counts = []
        errors = 0

        for i in range(iterations):
            try:
                # Use a random sample vector for each iteration
                sample = self.sample_vectors[i % len(self.sample_vectors)]
                vector = sample.vector
                
                # Measure search time
                start_time = time.time()
                results = self.client.query_points(
                    collection_name=self.collection_name,
                    query=vector,
                    query_filter=filter_obj,
                    limit=10,
                ).points
                elapsed_ms = (time.time() - start_time) * 1000

                latencies.append(elapsed_ms)
                result_counts.append(len(results))

            except Exception as e:
                errors += 1
                print(f"   ⚠️  Error on iteration {i + 1}: {str(e)}")

        if not latencies:
            return None

        return {
            "test_name": test_name,
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

    def get_sample_categories(self) -> List[str]:
        """Get sample category values from collection"""
        # Get a few points and extract unique categories
        points, _ = self.client.scroll(
            collection_name=self.collection_name,
            limit=100,
            with_payload=True,
        )
        
        categories = set()
        for point in points:
            if point.payload and 'category' in point.payload:
                categories.add(point.payload['category'])
        
        return list(categories)[:5]  # Return up to 5 categories

    def benchmark_no_filter_vs_filter(self, iterations: int = 20):
        """Compare performance: no filter vs with filter"""
        print("=" * 70)
        print("📊 BENCHMARK 1: No Filter vs Category Filter")
        print("=" * 70)
        print()

        # Get a sample category from the collection
        categories = self.get_sample_categories()
        if not categories:
            print("⚠️  No categories found in collection")
            return
        
        test_category = categories[0]

        # Test 1: No filter
        print("🔍 Test 1.1: No filter (baseline)")
        result_no_filter = self.run_search_benchmark(
            "No Filter", filter_obj=None, iterations=iterations
        )
        if result_no_filter:
            print(f"   Found {result_no_filter['avg_results']:.0f} avg results")

        # Test 2: With category filter
        print()
        print("🔍 Test 1.2: With category filter")
        print(f"   Category: {test_category}")
        
        category_filter = Filter(
            must=[FieldCondition(key="category", match=MatchValue(value=test_category))]
        )
        
        result_with_filter = self.run_search_benchmark(
            "Category Filter", filter_obj=category_filter, iterations=iterations
        )
        if result_with_filter:
            print(f"   Found {result_with_filter['avg_results']:.0f} avg results")

        # Compare results
        print()
        print("📈 Results:")
        print()

        if result_no_filter:
            print("No Filter:")
            print(f"   Mean:   {result_no_filter['mean_ms']:.2f}ms")
            print(f"   Median: {result_no_filter['median_ms']:.2f}ms")
            print(f"   P95:    {result_no_filter['p95_ms']:.2f}ms")
            print(f"   Std:    {result_no_filter['std_ms']:.2f}ms")
            print()

        if result_with_filter:
            print("Category Filter:")
            print(f"   Mean:   {result_with_filter['mean_ms']:.2f}ms")
            print(f"   Median: {result_with_filter['median_ms']:.2f}ms")
            print(f"   P95:    {result_with_filter['p95_ms']:.2f}ms")
            print(f"   Std:    {result_with_filter['std_ms']:.2f}ms")

        # Calculate speedup
        if result_no_filter and result_with_filter:
            speedup = result_no_filter["mean_ms"] / result_with_filter["mean_ms"]
            print()
            if speedup > 1:
                print(f"🚀 Speedup: {speedup:.2f}x faster with filter!")
            else:
                print(f"⚠️  Filter added {1/speedup:.2f}x overhead (expected with small dataset)")

        # Store results
        self.results["no_filter_vs_filter"] = {
            "no_filter": result_no_filter,
            "with_filter": result_with_filter,
        }

    def benchmark_multiple_categories(self, iterations: int = 20):
        """Test performance across multiple categories"""
        print()
        print("=" * 70)
        print("📊 BENCHMARK 2: Performance Across Different Categories")
        print("=" * 70)
        print()

        categories = self.get_sample_categories()
        if len(categories) < 2:
            print("⚠️  Not enough categories for this benchmark")
            return

        results_by_category = []

        for category in categories[:3]:  # Test up to 3 categories
            print(f"🔍 Testing category: {category}")
            
            category_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=category))]
            )
            
            result = self.run_search_benchmark(
                f"Category: {category}",
                filter_obj=category_filter,
                iterations=iterations,
            )
            
            if result:
                results_by_category.append(result)
                print(f"   Mean: {result['mean_ms']:.2f}ms, Results: {result['avg_results']:.0f}")
            print()

        # Summary table
        if results_by_category:
            print("📈 Results Summary:")
            print()
            print(f"{'Category':<30} {'Mean (ms)':<12} {'P95 (ms)':<12} {'Avg Results':<12}")
            print("-" * 70)
            for result in results_by_category:
                print(
                    f"{result['test_name']:<30} {result['mean_ms']:<12.2f} "
                    f"{result['p95_ms']:<12.2f} {result['avg_results']:<12.0f}"
                )

        self.results["multiple_categories"] = results_by_category

    def print_summary(self):
        """Print benchmark summary"""
        print()
        print("=" * 70)
        print("📊 BENCHMARK SUMMARY")
        print("=" * 70)
        print()

        if "no_filter_vs_filter" in self.results:
            no_filter = self.results["no_filter_vs_filter"].get("no_filter")
            with_filter = self.results["no_filter_vs_filter"].get("with_filter")
            
            if no_filter and with_filter:
                speedup = no_filter["mean_ms"] / with_filter["mean_ms"]
                print(f"1. Filter Performance: {speedup:.2f}x speedup with category filter")
            else:
                print("1. Filter Performance: Insufficient data")

        if "multiple_categories" in self.results and self.results["multiple_categories"]:
            avg_latency = statistics.mean([r["mean_ms"] for r in self.results["multiple_categories"]])
            print(f"2. Average Filtered Search: {avg_latency:.2f}ms across categories")

        print()
        print("💡 Tips for Better Performance:")
        print("   • Ensure payload indexes are created: python scripts/setup_payload_indexes.py")
        print("   • More selective filters = better performance")
        print("   • Combine multiple filters for precise results")
        print()

    def export_results(self, filepath: str):
        """Export benchmark results to JSON"""
        with open(filepath, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"📁 Results exported to: {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description="Benchmark payload indexes using existing collection data"
    )
    parser.add_argument(
        "--collection",
        type=str,
        default=None,
        help="Collection name (default: from settings)",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=20,
        help="Number of iterations per benchmark (default: 20)",
    )
    parser.add_argument(
        "--export",
        type=str,
        help="Export results to JSON file",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick benchmark (fewer iterations)",
    )

    args = parser.parse_args()

    # Adjust iterations
    iterations = 5 if args.quick else args.iterations
    
    # Use specified collection or default from settings
    collection_name = args.collection or settings.qdrant_collection_name

    print("=" * 70)
    print("🚀 QDRANT PAYLOAD INDEXING BENCHMARK")
    print("   (Using Existing Collection Data)")
    print("=" * 70)
    print(f"Collection: {collection_name}")
    print(f"Iterations per test: {iterations}")
    print("=" * 70)

    benchmark = ExistingCollectionBenchmark(collection_name=collection_name)

    try:
        benchmark.connect()

        # Get collection stats
        stats = benchmark.get_collection_stats()
        print("📊 Collection Statistics:")
        print(f"   Points: {stats['points_count']:,}")
        print(f"   Vector Size: {stats['vector_size']}")
        print(f"   Status: {stats['status']}")
        print()

        # Sample vectors for testing
        benchmark.sample_vectors_from_collection(count=min(50, iterations))

        # Run benchmarks
        benchmark.benchmark_no_filter_vs_filter(iterations)
        benchmark.benchmark_multiple_categories(iterations)

        # Print summary
        benchmark.print_summary()

        # Export if requested
        if args.export:
            benchmark.export_results(args.export)

        print("=" * 70)
        print()
        print("✅ Benchmark completed successfully!")

    except Exception as e:
        print(f"❌ Error during benchmark: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
