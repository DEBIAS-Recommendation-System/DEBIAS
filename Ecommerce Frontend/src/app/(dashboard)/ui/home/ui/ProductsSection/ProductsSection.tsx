"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Pagination } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useTranslation from "@/translation/useTranslation";
import Loading from "@/app/(adminDashboard)/loading";
import Product from "./Product";
import { getForYouRecommendations, OrchestratorRecommendation } from "@/actions/orchestrator";
import useCart from "@/hooks/data/cart/useCart";
import useWishlist from "@/hooks/data/wishlist/useWishlist";
import { formatProduct } from "@/hooks/data/products/formatProducts";

// Helper to get or create a user ID for recommendations
function getUserIdForRecommendations(): number {
  if (typeof window === "undefined") return 1;
  
  let userId = localStorage.getItem("recommendation_user_id");
  if (!userId) {
    // Generate a random user ID for anonymous users
    userId = String(Math.floor(Math.random() * 100000) + 1);
    localStorage.setItem("recommendation_user_id", userId);
  }
  return parseInt(userId, 10);
}

// Transform orchestrator recommendation to product format
function transformRecommendationToProduct(rec: OrchestratorRecommendation) {
  const payload = rec.payload || {};
  return {
    id: String(rec.product_id),
    product_id: rec.product_id,
    title: payload.title || `Product #${rec.product_id}`,
    price: payload.price || 0,
    imgUrl: payload.imgUrl || payload.image_url || null,
    brand: payload.brand,
    category: payload.category,
    description: payload.description || "",
    stock: 100,
    discount: 0,
    discount_type: "percentage" as const,
    category_id: 1,
    created_at: new Date().toISOString(),
    extra_images_urls: null,
    slug: null,
    subtitle: "",
    wholesale_price: payload.price || 0,
    score: rec.score,
    source: rec.source,
  };
}

export function ProductsSection() {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [userId, setUserId] = useState<number>(1);
  
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const queryClient = useQueryClient();
  const { data: translation } = useTranslation();

  // Get user ID on client side
  useEffect(() => {
    setUserId(getUserIdForRecommendations());
  }, []);

  // Fetch recommendations using orchestrator For You endpoint
  const { data: forYouResponse, isLoading, error } = useQuery({
    queryKey: ["for-you-recommendations", userId, page, pageSize],
    queryFn: async () => {
      const result = await getForYouRecommendations(userId, page, pageSize);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: userId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Transform and format products
  const products = (forYouResponse?.recommendations || [])
    .map((rec) => {
      const product = transformRecommendationToProduct(rec);
      return formatProduct(product, {
        cart: cart?.data?.map((item: any) => item.id),
        wishlist: wishlist?.data,
      });
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Calculate total pages (estimate based on has_more)
  const totalPages = forYouResponse?.has_more ? page + 1 : page;
  
  return (
    <section className="px-6 py-20" aria-labelledby="products-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-row items-center justify-center gap-3">
          <Image
            src="/home/icons/flower_yellow.png"
            alt=""
            height={15}
            width={15}
          />
          <h2 
            id="products-heading"
            className="text-4xl font-bold uppercase text-color5 max-[830px]:text-3xl max-[530px]:text-2xl"
          >
            {translation?.lang["our products"] || "Recommended For You"}
          </h2>
          <Image
            src="/home/icons/flower_yellow.png"
            alt=""
            height={15}
            width={15}
          />
        </div>
        <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 mb-12" />
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <p className="text-red-500">Error loading products: {JSON.stringify(error)}</p>
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <p className="text-gray-500">No products found. Check console for details.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, key) => (
              <Product key={product.id || key} {...product} />
            ))}
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            boundaryCount={1}
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </div>
      </div>
    </section>
  );
}

