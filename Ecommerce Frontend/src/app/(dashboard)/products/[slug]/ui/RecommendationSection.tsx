"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProductSwiper } from "./ProductSwiper";
import useTranslation from "@/translation/useTranslation";
import useProductById from "@/hooks/data/products/useProductById";
import { useQuery } from "@tanstack/react-query";
import { getRecommendationsByUserId, OrchestratorRecommendation } from "@/actions/orchestrator";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import useCart from "@/hooks/data/cart/useCart";
import useWishlist from "@/hooks/data/wishlist/useWishlist";
import { useEffect, useState } from "react";

// Helper to get or create a user ID for recommendations
function getUserIdForRecommendations(): number {
  if (typeof window === "undefined") return 1;
  
  let userId = localStorage.getItem("recommendation_user_id");
  if (!userId) {
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

export default function RecommendationSection() {
  const { slug } = useParams(); // This is actually the product ID
  const productId = Array.isArray(slug) ? slug[0] : slug;
  const { data } = useProductById(String(productId));
  const product = data?.data;
  const [userId, setUserId] = useState<number>(1);
  
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();

  // Get user ID on client side
  useEffect(() => {
    setUserId(getUserIdForRecommendations());
  }, []);
  
  // Fetch recommendations using orchestrator endpoint
  const { data: recommendationsResponse, isLoading } = useQuery({
    queryKey: ["product-recommendations", product?.id, userId],
    queryFn: async () => {
      if (!product?.id) return null;
      
      const result = await getRecommendationsByUserId(userId, 12, true);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!product?.id && userId > 0,
  });
  
  // Format products with cart and wishlist data
  const products = recommendationsResponse?.recommendations
    ?.filter((rec) => String(rec.product_id) !== product?.id) // Exclude the current product
    ?.map((rec) => {
      const transformedProduct = transformRecommendationToProduct(rec);
      return formatProduct(transformedProduct, {
        cart: cart?.data?.map((item: any) => item.id),
        wishlist: wishlist?.data,
      });
    }) || [];
  
  const { data: translation } = useTranslation();
  
  // Don't render if no products or still loading
  if (isLoading || !products || products.length === 0) return null;
  
  return (
    <div className="mt-20 flex flex-col gap-12 px-4">
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/blue-flower.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-2xl font-bold uppercase text-slate-700 dark:text-slate-200">
          {translation?.lang["We recommend"]}
        </div>
        <Image
          src="/home/icons/blue-flower.png"
          alt=""
          height={15}
          width={15}
        />
      </div>
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <span className="font-semibold">Based on your browsing history</span>
      </div>
      <ProductSwiper products={products} />
    </div>
  );
}
