# Benchmarking Guide

## Overview

This guide explains how to benchmark your Qdrant payload indexing implementation to measure actual performance improvements.

## Benchmark Script

The comprehensive benchmark script [`scripts/benchmark_payload_indexes.py`](scripts/benchmark_payload_indexes.py) measures:

1. **No filter vs Filter** - Baseline comparison
2. **Filter selectivity** - Impact of different filter types
3. **HNSW ef values** - Accuracy vs speed trade-offs
4. **MMR overhead** - Cost of diversity
5. **Throughput** - Queries per second under load

## Quick Start

### Basic Benchmark
```bash
# Run standard benchmark (20 iterations per test)
python scripts/benchmark_payload_indexes.py
```

### Quick Test
```bash
# Quick benchmark (5 iterations, faster)
python scripts/benchmark_payload_indexes.py --quick
```

### Full Benchmark
```bash
# Complete benchmark suite including MMR and throughput
python scripts/benchmark_payload_indexes.py --full --iterations 50
```

### Export Results
```bash
# Export results to JSON for analysis
python scripts/benchmark_payload_indexes.py --export results.json
```

## Understanding the Results

### 1. No Filter vs Filter
**What it measures**: Baseline search speed vs filtered search

**Example output**:
```
No Filter:
   Mean:   180.45ms
   Median: 175.23ms
   P95:    210.12ms

Category Filter:
   Mean:   45.67ms
   Median: 42.34ms
   P95:    55.89ms

🚀 Speedup: 3.95x faster with filter!
```

**What it means**: 
- Payload indexes enable faster filtered searches
- Counter-intuitive: Adding filters makes search **faster** (with indexes)

### 2. Filter Selectivity
**What it measures**: How filter selectivity affects performance

**Example output**:
```
Label                          Mean (ms)    P95 (ms)     Std (ms)
----------------------------------------------------------------------
No Filter (100%)               180.45       210.12       25.34
Broad Filter (~30-40%)         50.23        62.45        8.12
Moderate Filter (~10-20%)      35.67        42.89        5.34
```

**What it means**:
- More selective filters = better performance
- Qdrant automatically optimizes based on selectivity
- Validates the NSW-like behavior for selective filters

### 3. HNSW ef Values
**What it measures**: Accuracy vs speed trade-off

**Example output**:
```
ef Value        Mean (ms)    P95 (ms)     Std (ms)
----------------------------------------------------------
ef=default      42.34        52.12        6.78
ef=50           38.56        47.23        5.89
ef=100          45.67        56.34        7.12
ef=150          52.89        64.56        8.45
ef=200          61.23        74.89        9.78

💡 Insight: Higher ef values increase accuracy but also latency
```

**What it means**:
- `ef=50`: Fastest, good for less critical searches
- `ef=100-128`: Sweet spot for most e-commerce use cases
- `ef=200+`: Highest accuracy, use when precision is critical

### 4. MMR Overhead
**What it measures**: Performance cost of diversity

**Example output**:
```
No MMR:
   Mean:   45.67ms
   Median: 42.34ms

With MMR (diversity=0.7):
   Mean:   67.89ms
   Median: 65.12ms

💡 MMR Overhead: +48.7% latency for diversity
```

**What it means**:
- MMR adds ~50% overhead
- Worth it for product recommendations (diverse brands/categories)
- Not worth it for specific searches ("find this exact product")

### 5. Throughput
**What it measures**: Queries per second under load

**Example output**:
```
Successful: 50/50
Total time: 2.34s
Throughput: 21.37 queries/second
Avg latency: 46.78ms
```

**What it means**:
- Sustained query rate your system can handle
- Useful for capacity planning
- Scales with collection size and filter selectivity

## Performance Targets

### Latency (Mean)
- **Excellent**: < 50ms
- **Good**: 50-100ms
- **Acceptable**: 100-200ms
- **Poor**: > 200ms

### Throughput
- **Small collections (<100K)**: 50-100 QPS
- **Medium collections (100K-1M)**: 20-50 QPS
- **Large collections (>1M)**: 10-30 QPS

*Note: These are single-instance targets. Scale horizontally for higher throughput.*

### P95 Latency
Should be < 2x mean latency. If P95 is much higher, you have:
- Outliers due to cold cache
- GC pauses
- Network issues
- Resource contention

## Interpreting Speedup

### Expected Speedup with Payload Indexes

| Scenario | Without Indexes | With Indexes | Speedup |
|----------|----------------|--------------|---------|
| Selective filter (1-5%) | 1500ms | 100ms | 15x |
| Moderate filter (10-20%) | 800ms | 150ms | 5x |
| Broad filter (30-40%) | 400ms | 180ms | 2x |
| Very broad filter (>50%) | 250ms | 220ms | 1.1x |

**Key insight**: The more selective your filters, the bigger the improvement!

## Customizing Benchmarks

### Add Your Own Test Queries
Edit `benchmark_payload_indexes.py`:

```python
# Add custom benchmark
def benchmark_custom_scenario(self, iterations: int = 20):
    """Your custom benchmark"""
    print("\n" + "=" * 70)
    print("📊 CUSTOM BENCHMARK")
    print("=" * 70)
    
    # Your test queries
    queries = [
        ("smartphone with camera", {"category": "Electronics"}),
        ("running shoes", {"brand": "Nike"}),
        # ... more queries
    ]
    
    for query, filters in queries:
        result = self.run_search_benchmark(
            query_text=query,
            filter_conditions=filters,
            iterations=iterations,
            hnsw_ef=128
        )
        # Process results
```

### Test Different Collections
```bash
# Modify settings or pass collection name
QDRANT_COLLECTION_NAME=my_products python scripts/benchmark_payload_indexes.py
```

## Before vs After Comparison

### Step 1: Benchmark WITHOUT Payload Indexes
```bash
# Before creating indexes
python scripts/benchmark_payload_indexes.py --export before.json
```

### Step 2: Create Payload Indexes
```bash
python scripts/setup_payload_indexes.py
```

### Step 3: Benchmark WITH Payload Indexes
```bash
# After creating indexes
python scripts/benchmark_payload_indexes.py --export after.json
```

### Step 4: Compare Results
```python
import json

with open('before.json') as f:
    before = json.load(f)
with open('after.json') as f:
    after = json.load(f)

# Compare mean latencies
before_latency = before['benchmarks']['no_filter_vs_filter']['with_filter']['mean_ms']
after_latency = after['benchmarks']['no_filter_vs_filter']['with_filter']['mean_ms']

speedup = before_latency / after_latency
print(f"Speedup: {speedup:.2f}x faster!")
```

## Production Monitoring

### Key Metrics to Track

1. **Search Latency Distribution**
   - P50, P95, P99
   - By filter type (category, brand, etc.)
   - By time of day

2. **Throughput**
   - Queries per second
   - By endpoint
   - By filter selectivity

3. **Error Rates**
   - Timeouts
   - Failed searches
   - Index errors

4. **Resource Usage**
   - Memory consumption
   - CPU usage
   - Disk I/O (if using on-disk indexes)

### Example: Prometheus Metrics
```python
from prometheus_client import Histogram, Counter

search_latency = Histogram(
    'qdrant_search_latency_seconds',
    'Search latency in seconds',
    ['filter_type', 'has_indexes']
)

search_total = Counter(
    'qdrant_search_total',
    'Total number of searches',
    ['filter_type', 'status']
)

# In your search endpoint
with search_latency.labels(filter_type='category', has_indexes='true').time():
    results = qdrant_service.search(...)
search_total.labels(filter_type='category', status='success').inc()
```

## Troubleshooting Poor Performance

### Symptom: High latency despite indexes
**Possible causes**:
1. Indexes not actually created
2. Using non-indexed fields in filters
3. Very low filter selectivity
4. Collection not optimized

**Solutions**:
```bash
# Verify indexes exist
python scripts/setup_payload_indexes.py --info

# Check Qdrant segments
# Unoptimized segments don't use indexes efficiently
```

### Symptom: No speedup with filters
**Possible causes**:
1. Filter too broad (matches >50% of data)
2. Using OR conditions (less efficient)
3. Cold cache (first query is always slower)

**Solutions**:
- Use more selective filters
- Warm up cache before benchmarking
- Consider combining filters

### Symptom: High P95 but good P50
**Possible causes**:
1. Cold cache hits
2. GC pauses
3. Network jitter
4. Concurrent requests

**Solutions**:
- Increase memory to avoid GC
- Use connection pooling
- Run benchmark multiple times and discard first run

## Advanced Benchmarking

### Test Different Query Types
```python
# Semantic similarity
query = "device for taking photos"  # Matches "camera"

# Exact match
query = "Canon EOS R5"  # Specific product

# Broad category
query = "electronics"  # Many results
```

### Test Query Planning
```python
# Force different strategies by varying selectivity
filters = [
    {"category": "Electronics"},              # ~30% match
    {"brand": "Apple"},                        # ~5% match
    {"category": "Electronics", "brand": "Apple"}  # ~1% match
]
```

### Load Testing
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:8000/api/search?q=laptop&category=Electronics
```

## Best Practices

1. **Warm up before benchmarking**
   - Run each test once before measuring
   - Discard first result (cold cache)

2. **Run multiple iterations**
   - Minimum 10 iterations per test
   - 20-50 for production benchmarks
   - Use median, not just mean

3. **Test realistic queries**
   - Use actual user queries from logs
   - Test different filter combinations
   - Include edge cases

4. **Benchmark on production-like data**
   - Same data size
   - Same data distribution
   - Same hardware

5. **Document your results**
   - Save benchmark outputs
   - Track over time
   - Note configuration changes

## Example: Complete Benchmark Session

```bash
# 1. Initial benchmark
echo "=== Benchmarking before optimization ==="
python scripts/benchmark_payload_indexes.py --export baseline.json

# 2. Apply optimizations
echo "=== Creating payload indexes ==="
python scripts/setup_payload_indexes.py

# 3. Benchmark after optimization
echo "=== Benchmarking after optimization ==="
python scripts/benchmark_payload_indexes.py --full --export optimized.json

# 4. Compare results
python -c "
import json
with open('baseline.json') as f: baseline = json.load(f)
with open('optimized.json') as f: optimized = json.load(f)

b_mean = baseline['benchmarks']['no_filter_vs_filter']['with_filter']['mean_ms']
o_mean = optimized['benchmarks']['no_filter_vs_filter']['with_filter']['mean_ms']
print(f'Speedup: {b_mean/o_mean:.2f}x')
"
```

## Summary

✅ **Use the benchmark script** to measure actual performance
📊 **Track metrics** over time
🎯 **Set targets** based on your requirements
🔍 **Investigate** anomalies
📈 **Optimize** based on data

The benchmark script provides objective measurements to validate that:
1. Payload indexes provide the expected speedup (5-10x)
2. HNSW configuration is optimal for your use case
3. MMR overhead is acceptable for your application
4. Throughput meets production requirements

---

**Next Steps**:
1. Run benchmark: `python scripts/benchmark_payload_indexes.py`
2. Analyze results
3. Tune configuration based on findings
4. Re-benchmark to confirm improvements
