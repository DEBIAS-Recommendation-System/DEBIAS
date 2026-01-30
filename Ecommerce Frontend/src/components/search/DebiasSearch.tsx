'use client';

import { useState } from 'react';
import Image from 'next/image';
import { productsApi } from '@/api/fastapi';
import { ProductBase } from '@/types/fastapi';
import { PaginationParams } from '@/types/fastapi';

export default function DebiasSearch() {
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<number>(1000);
  const [results, setResults] = useState<ProductBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Using regular search for now - debiasSearch endpoint needs to be implemented in FastAPI
      const params: PaginationParams = {
        search: query.trim(),
        limit: 50,
      };

      const response = await productsApi.getAll(params);
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="debias-search-container">
      {/* Search Controls */}
      <div className="search-controls bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Perfect Product</h2>
        
        {/* Text Search */}
        <div className="mb-4">
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
            What are you looking for?
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Gaming Mouse, Laptop, Headphones..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Budget Slider */}
        <div className="mb-4">
          <label htmlFor="budget-slider" className="block text-sm font-medium text-gray-700 mb-2">
            Your Budget: ${budget.toFixed(2)}
          </label>
          <input
            id="budget-slider"
            type="range"
            min="10"
            max="5000"
            step="10"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$10</span>
            <span>$5,000</span>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors"
        >
          {loading ? 'Searching...' : 'Search Products'}
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-600 mt-3">
          💡 Our AI matches products to your needs AND budget, showing you the best options in order of relevance.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="results-section">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Results for "{query}" ({results.length} products)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            ✓ Results are ordered by relevance to your search, not just by price.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found. Try adjusting your search or budget.</p>
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product }: { product: ProductBase }) {
  return (
    <div className="product-card bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        <Image
          src={product.imgUrl || '/product/placeholder.png'}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-12">
          {product.title}
        </h4>
        
        <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
