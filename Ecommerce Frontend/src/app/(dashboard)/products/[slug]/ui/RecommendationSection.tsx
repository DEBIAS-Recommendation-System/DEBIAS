"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProductSwiper } from "./ProductSwiper";
import useTranslation from "@/translation/useTranslation";
import useProductById from "@/hooks/data/products/useProductById";
import { useQuery } from "@tanstack/react-query";
import getRecommendations from "@/actions/recommendations/getRecommendations";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import useCart from "@/hooks/data/cart/useCart";
import useWishlist from "@/hooks/data/wishlist/useWishlist";
import { Tables } from "@/types/database.types";

export default function RecommendationSection() {
  const { slug } = useParams(); // This is actually the product ID
  const productId = Array.isArray(slug) ? slug[0] : slug;
  const { data } = useProductById(String(productId));
  const product = data?.data;
  
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  
  // Fetch recommendations using the recommendations API endpoint
  // Uses semantic vector search with MMR for diverse, relevant results
  const { data: recommendationsResponse, isLoading } = useQuery({
    queryKey: ["product-recommendations", product?.id, product?.category, product?.brand],
    queryFn: async () => {
      if (!product?.title) return null;
      
      // Build a rich semantic query combining product attributes for best results
      // Include title, category, and brand for comprehensive semantic matching
      const queryParts = [product.title];
      if (product.category) queryParts.push(product.category);
      if (product.brand) queryParts.push(product.brand);
      if (product.description) {
        // Add first 100 chars of description for more context
        queryParts.push(product.description.substring(0, 100));
      }
      const queryText = queryParts.join(" ");
      
      return await getRecommendations({
        query_text: queryText,
        limit: 15, // Request more to account for filtering out current product
        score_threshold: 0.3, // Minimum similarity threshold for quality results
        use_mmr: true, // Enable Maximal Marginal Relevance for diverse results
        mmr_diversity: 0.5, // Balance between relevance (0) and diversity (1)
        mmr_candidates: 50, // Larger candidate pool for better MMR selection
        filters: product.category ? { category: product.category } : undefined, // Filter by same category for relevance
      });
    },
    enabled: !!product?.id && !!product?.title,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Transform recommendations to product format compatible with ProductSwiper
  const products = recommendationsResponse?.data?.recommendations
    ?.filter((rec) => String(rec.id) !== String(product?.id)) // Exclude current product
    ?.slice(0, 12) // Limit to 12 products for the swiper
    ?.map((rec) => {
      // Transform recommendation to Tables<"products"> format
      const productData: Tables<"products"> = {
        id: String(rec.id),
        title: rec.title,
        brand: rec.brand || "",
        category: rec.category || "",
        price: rec.price || 0,
        image_url: rec.image_url || "",
        description: rec.description || "",
        stock: 100, // Default stock
        discount: 0,
        discount_type: "PERCENTAGE",
        subtitle: "",
        category_id: 1,
        created_at: new Date().toISOString(),
        slug: null,
        wholesale_price: rec.price || 0,
        extra_images_urls: null,
      };
      
      return formatProduct(productData, {
        cart: cart?.data?.map((item) => item.id),
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
        <span className="font-semibold">Similar to:</span> {product?.title}
      </div>
      <ProductSwiper products={products} />
    </div>
  );
}
