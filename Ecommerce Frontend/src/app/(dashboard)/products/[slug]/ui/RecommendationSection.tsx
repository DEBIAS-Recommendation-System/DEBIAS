"use client";
import useProducts from "@/hooks/data/products/useProducts";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProductSwiper } from "./ProductSwiper";
import useTranslation from "@/translation/useTranslation";
import useProductBySlug from "@/hooks/data/products/useProductBySlug";

export default function RecommendationSection() {
  const { slug } = useParams();
  const decodedSlug = decodeURIComponent(Array.isArray(slug) ? slug[0] : slug);
  const { data } = useProductBySlug(String(decodedSlug));
  const product = data?.data;
  const { data: products } = useProducts({
    page: 1,
    limit: 12,
    match: { category_id: product?.category_id },
    filters: {
      minStock: 1,
    },
  });
  const { data: translation } = useTranslation();
  if (!products.data || products.data?.length === 0) return null;
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
      <ProductSwiper products={products?.data} />
    </div>
  );
}
