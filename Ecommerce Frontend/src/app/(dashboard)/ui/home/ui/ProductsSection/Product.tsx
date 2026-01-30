"use client";
import TooltipGeneric from "@/app/ui/InsightGeneric";
import Image from "next/image";
import Link from "next/link";
import AddToCartBtn from "./AddToCartBtn";
import { WishlistHart } from "./WishListHart";
import { IProduct } from "@/types/database.tables.types";

export default function Product(product: Partial<IProduct>) {
  return (
    <article className="group relative flex h-[420px] max-h-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {/* Discount Badge */}
        {!!product.discount && (
          <div 
            className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 text-sm font-bold text-white shadow-lg"
            aria-label={`${product.discount}% discount`}
          >
            -{product.discount}%
          </div>
        )}

        {/* Product Image */}
        <Link href={`/products/${product.id || product.product_id}`} className="relative block h-full w-full">
          <Image
            src={product.imgUrl || "/product/prod2.jpg"}
            alt={product.title || "Product image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = "/product/prod2.jpg";
            }}
          />
        </Link>

        {/* Action Buttons */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex translate-y-full gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex-1">
            <AddToCartBtn
              product_id={product.id ?? ""}
              isInCart={product.isInCart}
              available={product.available}
            />
          </div>
          <div className="flex-shrink-0">
            <WishlistHart
              product_id={product.id}
              isInWishlist={product.isInWishlist}
              variant="relative"
            />
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <TooltipGeneric tip={product.title ?? ""}>
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            {product.title}
          </h3>
        </TooltipGeneric>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          {!!product.discount ? (
            <>
              <span className="text-lg font-bold text-blue-600">
                {product.price_after_discount} TND
              </span>
              <del className="text-sm text-slate-400">{product.price} TND</del>
            </>
          ) : (
            <span className="text-lg font-bold text-slate-900">
              {product.price} TND
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
