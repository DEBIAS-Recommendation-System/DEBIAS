"use client";
import useProductById from "@/hooks/data/products/useProductById";
import useTranslation from "@/translation/useTranslation";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BreadCrumbs() {
  const { slug } = useParams(); // This is actually the product ID
  const productId = Array.isArray(slug) ? slug[0] : slug;
  const { data } = useProductById(String(productId));
  const product = data?.data;
  const { data: translation } = useTranslation();
  return (
    <div  dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} className="flex w-full items-center justify-center bg-gray-100">
      <div className="flex h-[3rem] w-full max-w-[75rem] flex-row items-center justify-start gap-3 px-6 text-sm capitalize">
        <Link
          href={"/"}
          className="cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline"
        >
          {translation?.lang["home"]}
        </Link>
        <span>{">"}</span>
        <Link
          href={"/products"}
          className="cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline"
        >
          {translation?.lang["Products"] || "Products"}
        </Link>
        {product?.title && (
          <>
            <span>{">"}</span>
            <Link
              href={`products/${productId}`}
              className="cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline"
            >
              {product?.title}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
