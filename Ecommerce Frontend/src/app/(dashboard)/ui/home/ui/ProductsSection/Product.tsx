"use client";
import TooltipGeneric from "@/app/ui/InsightGeneric";
import Image from "next/image";
import Link from "next/link";
import AddToCartBtn from "./AddToCartBtn";
import { WishlistHart } from "./WishListHart";
import { IProduct } from "@/types/database.tables.types";

export default function Product(product: Partial<IProduct>) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 md:h-72">
        {!!product.discount && (
          <div 
            className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 text-sm font-bold text-white shadow-lg z-10"
            aria-label={`${product.discount}% discount`}
          >
            -{product.discount}%
          </div>
        )}
        <Link href={`/products/${product.slug}`}>
          <Image
            src={"/product/prod2.jpg"}
            alt={product.title || "Product image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        <AddToCartBtn
          product_id={product.id ?? ""}
          isInCart={product.isInCart}
          available={product.available}
        />
        <WishlistHart
          product_id={product.id}
          isInWishlist={product.isInWishlist}
          variant="absolute"
        />
      </div>
      
      <div className="flex flex-1 flex-col gap-3 p-4">
        <TooltipGeneric tip={product.title ?? ""}>
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            {product.title}
          </h3>
        </TooltipGeneric>
        
        <div className="flex items-center gap-2 text-sm">
          {!!product.discount && (
            <span className="text-lg font-bold text-blue-600">
              {product.price_after_discount} TND
            </span>
          )}
          {!!product.discount ? (
            <del className="text-sm text-slate-400">{product.price} TND</del>
          ) : (
            <span className="text-lg font-bold text-slate-900">{product.price} TND</span>
          )}
        </div>
      </div>
    </article>
  );
}
