"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProductSwiper } from "./ProductSwiper";
import useTranslation from "@/translation/useTranslation";
import useProductBySlug from "@/hooks/data/products/useProductBySlug";
import useFormattedProducts from "@/hooks/data/products/useFormattedProducts";

export default function RecommendationSection() {
  const { slug } = useParams();
  const decodedSlug = decodeURIComponent(Array.isArray(slug) ? slug[0] : slug);
  const { data } = useProductBySlug(String(decodedSlug));
  const product = data?.data;
  
  // Fetch formatted products with cart and wishlist data
  const { data: productsResponse } = useFormattedProducts({ page: 1, limit: 12 });
  
  // Just show the first 12 products
  const products = productsResponse?.data || [];
  
  const { data: translation } = useTranslation();
  if (!products || products.length === 0) return null;
  return (
    <div className="mt-20 flex flex-col gap-12">
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/blue-flower.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-2xl font-bold uppercase text-slate-700">
          {translation?.lang["We recommend"]}
        </div>
        <Image
          src="/home/icons/blue-flower.png"
          alt=""
          height={15}
          width={15}
        />
      </div>
      <ProductSwiper products={products} />
    </div>
  );
}
