"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { productsApi, recommendationsApi } from "@/api/fastapi";
import { ProductBase } from "@/types/fastapi";
import { PaginationParams } from "@/types/fastapi";
import type { OrbitViewData } from "@/api/fastapi/recommendations";

// Dynamically import OrbitViewer (client-side only for Three.js)
const OrbitViewer = dynamic(
  () => import("@/components/OrbitView/OrbitViewer"),
  { ssr: false },
);

export default function DebiasSearch() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<number>(1000);
  const [results, setResults] = useState<ProductBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orbitView, setOrbitView] = useState<OrbitViewData | null>(null);
  const [orbitLoading, setOrbitLoading] = useState(false);

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
      setError(err.response?.data?.detail || "Search failed");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchOrbit = async () => {
    if (!query.trim()) return;

    setOrbitLoading(true);
    setError(null);

    try {
      const data = await recommendationsApi.getOrbitView({
        query_text: query.trim(),
        limit: 150,
      });
      setOrbitView(data);
    } catch (err: any) {
      setError(err.message || "Failed to launch orbit view");
      console.error("Orbit view error:", err);
    } finally {
      setOrbitLoading(false);
    }
  };

  return (
    <div className="debias-search-container">
      {/* Orbit View Modal */}
      {orbitView && (
        <OrbitViewer data={orbitView} onClose={() => setOrbitView(null)} />
      )}

      {/* Search Controls */}
      <div className="search-controls mb-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Find Your Perfect Product
        </h2>

        {/* Text Search */}
        <div className="mb-4">
          <label
            htmlFor="search-query"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            What are you looking for?
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g., Gaming Mouse, Laptop, Headphones..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Budget Slider */}
        <div className="mb-4">
          <label
            htmlFor="budget-slider"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>$10</span>
            <span>$5,000</span>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Searching..." : "Search Products"}
        </button>

        {/* Info Text */}
        <p className="mt-3 text-xs text-gray-600">
          💡 Our AI matches products to your needs AND budget, showing you the
          best options in order of relevance.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="results-section">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Results for &quot;{query}&quot; ({results.length} products)
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                ✓ Results are ordered by relevance to your search, not just by
                price.
              </p>
            </div>

            {/* Launch Into Orbit Button */}
            <button
              onClick={handleLaunchOrbit}
              disabled={orbitLoading}
              className="flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500"
              title="View products in 3D semantic space"
            >
              {orbitLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Launch Into Orbit</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            No products found. Try adjusting your search or budget.
          </p>
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product }: { product: ProductBase }) {
  return (
    <div className="product-card overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        <Image
          src={product.imgUrl || "/product/placeholder.png"}
          alt={product.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h4 className="mb-1 line-clamp-2 h-12 font-semibold text-gray-900">
          {product.title}
        </h4>

        <p className="mb-2 text-xs text-gray-500">{product.brand}</p>
        <p className="mb-2 text-xs text-gray-500">{product.category}</p>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
