"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProductSwiper } from "./ProductSwiper";
import useTranslation from "@/translation/useTranslation";
import useProductById from "@/hooks/data/products/useProductById";
import { useQuery } from "@tanstack/react-query";
import getSemanticSearch from "@/actions/products/getSemanticSearch";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import useCart from "@/hooks/data/cart/useCart";
import useWishlist from "@/hooks/data/wishlist/useWishlist";

export default function RecommendationSection() {
  const { slug } = useParams(); // This is actually the product ID
  const productId = Array.isArray(slug) ? slug[0] : slug;
  const { data } = useProductById(String(productId));
  const product = data?.data;
  
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  
  // Fetch recommendations using semantic search based on current product
  // This endpoint returns full product objects and has a fallback to regular search
  const { data: semanticSearchResponse, isLoading } = useQuery({
    queryKey: ["product-recommendations", product?.id, product?.category],
    queryFn: async () => {
      if (!product?.title) return null;
      
      // Create a semantic query based on the current product
      const searchQuery = `${product.category} ${product.brand} similar to ${product.title}`;
      
      return await getSemanticSearch({
        query: searchQuery,
        limit: 12,
        category: product.category,
        use_mmr: true,
        mmr_diversity: 0.6,
      });
    },
    enabled: !!product?.id && !!product?.title,
  });
  
  // Format products with cart and wishlist data
  const products = semanticSearchResponse?.data
    ?.filter((p) => p.id !== product?.id) // Exclude the current product
    ?.map((p) =>
      formatProduct(p, {
        cart: cart?.data?.map((item) => item.id),
        wishlist: wishlist?.data,
      })
    ) || [];
  
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
