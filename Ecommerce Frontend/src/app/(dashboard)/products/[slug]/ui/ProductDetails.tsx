"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import useTranslation from "@/translation/useTranslation";
import CustomSwiper from "@/app/ui/Swiper";
import useProductById from "@/hooks/data/products/useProductById";
import { WishlistHart } from "@/app/(dashboard)/ui/home/ui/ProductsSection/WishListHart";
import AddToCartBtn from "@/app/(dashboard)/ui/home/ui/ProductsSection/AddToCartBtn";
import { useEffect } from "react";
import { sendEvent } from "@/actions/events/sendEvent";
import { getSessionId } from "@/utils/session";

export default function ProductDetails() {
  const { slug } = useParams(); // This is actually the product ID
  const { data: translation } = useTranslation();
  const productId = Array.isArray(slug) ? slug[0] : slug;
  const { data } = useProductById(String(productId));
  const product = data?.data;
  
  // Send view event when product is loaded
  useEffect(() => {
    if (product?.product_id) {
      const sessionId = getSessionId();
      sendEvent({
        event_type: "view",
        product_id: product.product_id,
        user_session: sessionId,
      }).catch(err => console.error("Failed to send view event:", err));
    }
  }, [product?.product_id]);
  
  // Calculate discount percentage if applicable
  const discountPercentage = product?.discount || 0;
  const priceAfterDiscount = product?.price ? product.price * (1 - discountPercentage / 100) : 0;
  
  return (
    <div dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} className="py-8 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700 shadow-xl">
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                  -{discountPercentage}%
                </div>
              )}
              <CustomSwiper
                className="w-full aspect-square"
                navigation
                loop
                pagination
                allowTouchMove
                autoplay={{
                  delay: 5000,
                }}
                slides={[
                  product?.imgUrl,
                  ...(product?.extra_images_urls ?? []),
                ].filter(Boolean).map((url) => (
                  <Image
                    key={url}
                    className="object-contain w-full h-full"
                    width={800}
                    height={800}
                    src={url ?? ""}
                    alt={product?.title || "Product Image"}
                    priority
                  />
                ))}
              />
            </div>
          </div>

          {/* Product Information Section */}
          <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  {product?.title ?? ""}
                </h1>
                <WishlistHart
                  variant="relative"
                  product_id={product?.id}
                  isInWishlist={product?.isInWishlist}
                />
              </div>
              {product?.subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {product.subtitle}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-6 space-y-3">
              <div className="flex items-baseline gap-3">
                {discountPercentage > 0 ? (
                  <>
                    <span className="text-4xl font-bold text-red-600 dark:text-red-400">
                      {priceAfterDiscount.toFixed(2)} TND
                    </span>
                    <span className="text-2xl text-gray-500 line-through dark:text-gray-400">
                      {product?.price} TND
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {product?.price} TND
                  </span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  You save {(product?.price! - priceAfterDiscount).toFixed(2)} TND ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Brand</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {product?.brand || "N/A"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {product?.category || "N/A"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {translation?.lang["Availability"]}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    product?.stock && product.stock > 0 ? "bg-green-500" : "bg-red-500"
                  }`} />
                  <p className={`font-semibold ${
                    product?.stock && product.stock > 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {product?.stock && product.stock > 0
                      ? `${product.stock} ${translation?.lang["In Stock"] || "In Stock"}`
                      : translation?.lang["Out of Stock"] || "Out of Stock"}
                  </p>
                </div>
              </div>
              {product?.slug && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Product ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
                    {product.slug}
                  </p>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            {product?.stock && product.stock > 0 ? (
              <AddToCartBtn
                product_id={product?.id ?? ""}
                isInCart={product?.isInCart}
                available={product?.stock > 0}
                className="w-full h-14 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              />
            ) : (
              <button
                disabled
                className="w-full h-14 text-lg font-semibold rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              >
                {translation?.lang["Out of Stock"] || "Out of Stock"}
              </button>
            )}

            {/* Description Section */}
            {product?.description && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {translation?.lang["Product Description"] || "Product Description"}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {product?.wholesale_price && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Wholesale Price:</span> {product.wholesale_price} TND
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
