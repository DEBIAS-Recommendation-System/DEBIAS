"""
Benchmark Script: Payload Indexing Performance

This script benchmarks the performance improvements from payload indexing
by comparing search latency, throughput, and accuracy with different configurations.

Usage:
    python scripts/benchmark_payload_indexes.py
    python scripts/benchmark_payload_indexes.py --iterations 100
    python scripts/benchmark_payload_indexes.py --export results.json
"""

import sys
import time
import json
import statistics
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.qdrant_service import qdrant_service
from app.core.config import settings


class Benchmark:
    """Performance benchmark suite for Qdrant payload indexing"""

    def __init__(self, collection_name: str = None):
        self.collection_name = collection_name or settings.qdrant_collection_name
        self.results = {}

    def connect_and_initialize(self):
        """Connect to Qdrant and initialize models"""
        print("🔌 Connecting to Qdrant...")
        qdrant_service.connect()
        qdrant_service.initialize_text_embedding_model()
        print("✅ Connected and initialized\n")

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        info = qdrant_service.get_collection_info(self.collection_name)
        return {
            "points_count": info.get("points_count", 0),
            "vectors_count": info.get("vectors_count", 0),
            "status": info.get("status", "unknown"),
        }

    def run_search_benchmark(
        self,
        query_text: str,
        filter_conditions: Dict[str, Any] = None,
        iterations: int = 10,
        hnsw_ef: int = None,
        label: str = "",
    ) -> Dict[str, Any]:
        """
        Run search benchmark with multiple iterations

        Returns:
            Dict with mean, median, min, max, std latencies
        """
        latencies = []

        for i in range(iterations):
            start = time.time()
            try:
                results = qdrant_service.search(
                    query_text=query_text,
                    filter_conditions=filter_conditions,
                    limit=10,
                    hnsw_ef=hnsw_ef,
                    collection_name=self.collection_name,
                )
                latency = (time.time() - start) * 1000  # Convert to ms
                latencies.append(latency)

                # Only print progress for first run
                if i == 0:
                    print(f"   Found {len(results)} results")

            except Exception as e:
                print(f"   ⚠️  Error on iteration {i + 1}: {e}")
                continue

        if not latencies:
            return None

        return {
            "label": label,
            "query": query_text,
            "filter": filter_conditions,
            "hnsw_ef": hnsw_ef,
            "iterations": len(latencies),
            "mean_ms": statistics.mean(latencies),
            "median_ms": statistics.median(latencies),
            "min_ms": min(latencies),
            "max_ms": max(latencies),
            "std_ms": statistics.stdev(latencies) if len(latencies) > 1 else 0,
            "p95_ms": sorted(latencies)[int(len(latencies) * 0.95)]
            if len(latencies) > 1
            else latencies[0],
        }

    def benchmark_no_filter_vs_filter(self, iterations: int = 20):
        """Benchmark: Search without filter vs with filter"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK 1: No Filter vs Category Filter")
        print("=" * 70)

        query = "laptop computer"

        # Test 1: No filter
        print("\n🔍 Test 1.1: No filter (baseline)")
        result_no_filter = self.run_search_benchmark(
            query_text=query,
            filter_conditions=None,
            iterations=iterations,
            label="No Filter",
        )

        # Test 2: With category filter
        print("\n🔍 Test 1.2: With category filter")
        result_with_filter = self.run_search_benchmark(
            query_text=query,
            filter_conditions={"category": "Electronics"},
            iterations=iterations,
            hnsw_ef=128,
            label="Category Filter",
        )

        # Results
        self.results["no_filter_vs_filter"] = {
            "no_filter": result_no_filter,
            "with_filter": result_with_filter,
        }

        self._print_comparison(result_no_filter, result_with_filter)

    def benchmark_filter_selectivity(self, iterations: int = 20):
        """Benchmark: Different filter selectivity levels"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK 2: Filter Selectivity Impact")
        print("=" * 70)
        print("Testing how selectivity affects performance\n")

        query = "wireless headphones"
        results = []

        # Test different filters with varying selectivity
        test_cases = [
            {
                "label": "No Filter (100%)",
                "filter": None,
                "description": "All products",
            },
            {
                "label": "Broad Filter (~30-40%)",
                "filter": {"category": "Electronics"},
                "description": "Large category",
            },
            {
                "label": "Moderate Filter (~10-20%)",
                "filter": {"brand": "Sony"},
                "description": "Specific brand",
            },
        ]

        for i, test in enumerate(test_cases, 1):
            print(f"\n🔍 Test 2.{i}: {test['label']}")
            print(f"   {test['description']}")
            result = self.run_search_benchmark(
                query_text=query,
                filter_conditions=test["filter"],
                iterations=iterations,
                hnsw_ef=128 if test["filter"] else None,
                label=test["label"],
            )
            results.append(result)

        self.results["filter_selectivity"] = results
        self._print_selectivity_comparison(results)

    def benchmark_hnsw_ef_values(self, iterations: int = 20):
        """Benchmark: Different hnsw_ef values"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK 3: HNSW ef Parameter Impact")
        print("=" * 70)
        print("Testing different ef values with strict filter\n")

        query = "smartphone"
        filter_conditions = {"category": "Electronics"}
        ef_values = [None, 50, 100, 150, 200]
        results = []

        for i, ef in enumerate(ef_values, 1):
            ef_label = "default" if ef is None else str(ef)
            print(f"\n🔍 Test 3.{i}: hnsw_ef={ef_label}")
            result = self.run_search_benchmark(
                query_text=query,
                filter_conditions=filter_conditions,
                iterations=iterations,
                hnsw_ef=ef,
                label=f"ef={ef_label}",
            )
            results.append(result)

        self.results["hnsw_ef_comparison"] = results
        self._print_ef_comparison(results)

    def benchmark_mmr_overhead(self, iterations: int = 20):
        """Benchmark: MMR diversity impact"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK 4: MMR Diversity Overhead")
        print("=" * 70)
        print("Testing MMR performance overhead\n")

        query = "laptop"
        filter_conditions = {"category": "Computers"}

        # Test 1: No MMR
        print("\n🔍 Test 4.1: Standard search (no MMR)")
        result_no_mmr = self.run_search_benchmark(
            query_text=query,
            filter_conditions=filter_conditions,
            iterations=iterations,
            hnsw_ef=128,
            label="No MMR",
        )

        # Test 2: With MMR
        print("\n🔍 Test 4.2: With MMR (diversity=0.7)")
        # Note: MMR requires direct API call, simplified here
        latencies = []
        for i in range(iterations):
            start = time.time()
            try:
                results = qdrant_service.search(
                    query_text=query,
                    filter_conditions=filter_conditions,
                    limit=10,
                    hnsw_ef=128,
                    use_mmr=True,
                    mmr_diversity=0.7,
                    mmr_candidates=20,
                    collection_name=self.collection_name,
                )
                latency = (time.time() - start) * 1000
                latencies.append(latency)
                if i == 0:
                    print(f"   Found {len(results)} results")
            except Exception as err:
                print(f"   ⚠️  Error: {err}")
                continue

        result_with_mmr = {
            "label": "With MMR",
            "mean_ms": statistics.mean(latencies) if latencies else 0,
            "median_ms": statistics.median(latencies) if latencies else 0,
            "std_ms": statistics.stdev(latencies) if len(latencies) > 1 else 0,
        }

        self.results["mmr_overhead"] = {
            "no_mmr": result_no_mmr,
            "with_mmr": result_with_mmr,
        }

        self._print_mmr_comparison(result_no_mmr, result_with_mmr)

    def benchmark_concurrent_load(self, iterations: int = 50):
        """Benchmark: Throughput under load"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK 5: Throughput Test")
        print("=" * 70)
        print(f"Running {iterations} searches to measure throughput\n")

        query = "product search"
        filter_conditions = {"category": "Electronics"}

        start_time = time.time()
        successful = 0
        failed = 0

        for i in range(iterations):
            try:
                qdrant_service.search(
                    query_text=query,
                    filter_conditions=filter_conditions,
                    limit=10,
                    hnsw_ef=128,
                    collection_name=self.collection_name,
                )
                successful += 1
            except Exception:
                failed += 1

            # Progress indicator
            if (i + 1) % 10 == 0:
                print(f"   Progress: {i + 1}/{iterations}")

        total_time = time.time() - start_time
        qps = successful / total_time if total_time > 0 else 0

        result = {
            "total_queries": iterations,
            "successful": successful,
            "failed": failed,
            "total_time_s": total_time,
            "queries_per_second": qps,
            "avg_latency_ms": (total_time / successful * 1000) if successful > 0 else 0,
        }

        self.results["throughput"] = result

        print("\n📈 Results:")
        print(f"   Successful: {successful}/{iterations}")
        print(f"   Total time: {total_time:.2f}s")
        print(f"   Throughput: {qps:.2f} queries/second")
        print(f"   Avg latency: {result['avg_latency_ms']:.2f}ms")

    def _print_comparison(self, result1: Dict, result2: Dict):
        """Print comparison between two results"""
        if not result1 or not result2:
            print("\n⚠️  Insufficient data for comparison")
            return

        print("\n📈 Results:")
        print(f"\n{result1['label']}:")
        print(f"   Mean:   {result1['mean_ms']:.2f}ms")
        print(f"   Median: {result1['median_ms']:.2f}ms")
        print(f"   P95:    {result1['p95_ms']:.2f}ms")
        print(f"   Std:    {result1['std_ms']:.2f}ms")

        print(f"\n{result2['label']}:")
        print(f"   Mean:   {result2['mean_ms']:.2f}ms")
        print(f"   Median: {result2['median_ms']:.2f}ms")
        print(f"   P95:    {result2['p95_ms']:.2f}ms")
        print(f"   Std:    {result2['std_ms']:.2f}ms")

        speedup = result1["mean_ms"] / result2["mean_ms"]
        if speedup > 1:
            print(f"\n🚀 Speedup: {speedup:.2f}x faster with filter!")
        else:
            print(
                f"\n📊 Ratio: {1 / speedup:.2f}x (filtered search takes {1 / speedup:.2f}x time)"
            )

    def _print_selectivity_comparison(self, results: List[Dict]):
        """Print selectivity comparison"""
        print("\n📈 Results Summary:")
        print(f"\n{'Label':<30} {'Mean (ms)':<12} {'P95 (ms)':<12} {'Std (ms)':<12}")
        print("-" * 70)
        for r in results:
            if r:
                print(
                    f"{r['label']:<30} {r['mean_ms']:<12.2f} {r['p95_ms']:<12.2f} {r['std_ms']:<12.2f}"
                )

    def _print_ef_comparison(self, results: List[Dict]):
        """Print ef values comparison"""
        print("\n📈 Results Summary:")
        print(f"\n{'ef Value':<15} {'Mean (ms)':<12} {'P95 (ms)':<12} {'Std (ms)':<12}")
        print("-" * 60)
        for r in results:
            if r:
                print(
                    f"{r['label']:<15} {r['mean_ms']:<12.2f} {r['p95_ms']:<12.2f} {r['std_ms']:<12.2f}"
                )

        print(
            "\n💡 Insight: Higher ef values increase accuracy but also latency (trade-off)"
        )

    def _print_mmr_comparison(self, result1: Dict, result2: Dict):
        """Print MMR comparison"""
        if not result1 or not result2:
            return

        print("\n📈 Results:")
        print(f"\n{result1['label']}:")
        print(f"   Mean:   {result1['mean_ms']:.2f}ms")
        print(f"   Median: {result1['median_ms']:.2f}ms")

        print(f"\n{result2['label']}:")
        print(f"   Mean:   {result2['mean_ms']:.2f}ms")
        print(f"   Median: {result2['median_ms']:.2f}ms")

        overhead = (
            (result2["mean_ms"] / result1["mean_ms"] - 1) * 100
            if result1["mean_ms"] > 0
            else 0
        )
        print(f"\n💡 MMR Overhead: +{overhead:.1f}% latency for diversity")

    def export_results(self, filename: str = "benchmark_results.json"):
        """Export results to JSON file"""
        output = {
            "timestamp": datetime.now().isoformat(),
            "collection": self.collection_name,
            "stats": self.get_collection_stats(),
            "benchmarks": self.results,
        }

        output_path = Path(filename)
        with output_path.open("w") as f:
            json.dump(output, f, indent=2)

        print(f"\n💾 Results exported to: {output_path.absolute()}")

    def print_summary(self):
        """Print final summary"""
        print("\n" + "=" * 70)
        print("📊 BENCHMARK SUMMARY")
        print("=" * 70)

        if "no_filter_vs_filter" in self.results:
            data = self.results["no_filter_vs_filter"]
            if data.get("no_filter") and data.get("with_filter"):
                speedup = data["no_filter"]["mean_ms"] / data["with_filter"]["mean_ms"]
                print(
                    f"\n1. Filter Performance: {speedup:.2f}x speedup with category filter"
                )

        if "filter_selectivity" in self.results:
            print("2. Selectivity: More selective filters = better index utilization")

        if "hnsw_ef_comparison" in self.results:
            results = self.results["hnsw_ef_comparison"]
            if results and len(results) > 1:
                fastest = min(
                    results, key=lambda x: x["mean_ms"] if x else float("inf")
                )
                print(f"3. Optimal ef: {fastest['label']} ({fastest['mean_ms']:.2f}ms)")

        if "mmr_overhead" in self.results:
            data = self.results["mmr_overhead"]
            if data.get("no_mmr") and data.get("with_mmr"):
                overhead = (
                    data["with_mmr"]["mean_ms"] / data["no_mmr"]["mean_ms"] - 1
                ) * 100
                print(f"4. MMR Overhead: +{overhead:.1f}% for diversity")

        if "throughput" in self.results:
            qps = self.results["throughput"]["queries_per_second"]
            print(f"5. Throughput: {qps:.2f} queries/second")

        print("\n" + "=" * 70)


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Benchmark Qdrant payload indexing performance"
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
    parser.add_argument(
        "--full",
        action="store_true",
        help="Full benchmark suite (all tests)",
    )

    args = parser.parse_args()

    # Adjust iterations
    iterations = 5 if args.quick else args.iterations

    # Use specified collection or default from settings
    collection_name = args.collection or settings.qdrant_collection_name

    print("=" * 70)
    print("🚀 QDRANT PAYLOAD INDEXING BENCHMARK")
    print("=" * 70)
    print(f"Collection: {collection_name}")
    print(f"Iterations per test: {iterations}")
    print("=" * 70)

    benchmark = Benchmark(collection_name=collection_name)

    try:
        benchmark.connect_and_initialize()

        # Get collection stats
        stats = benchmark.get_collection_stats()
        print("📊 Collection Statistics:")
        print(f"   Points: {stats['points_count']:,}")
        print(f"   Vectors: {stats['vectors_count']:,}")
        print(f"   Status: {stats['status']}")

        # Run benchmarks
        benchmark.benchmark_no_filter_vs_filter(iterations)
        benchmark.benchmark_filter_selectivity(iterations)
        benchmark.benchmark_hnsw_ef_values(iterations)

        if args.full:
            benchmark.benchmark_mmr_overhead(iterations)
            benchmark.benchmark_concurrent_load(iterations)

        # Print summary
        benchmark.print_summary()

        # Export if requested
        if args.export:
            benchmark.export_results(args.export)

        print("\n✅ Benchmark completed successfully!")

    except Exception as e:
        print(f"\n❌ Error during benchmark: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
