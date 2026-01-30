"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getComplementaryProducts, ComplementaryRecommendation } from "@/actions/orchestrator";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import useCart from "@/hooks/data/cart/useCart";
import useWishlist from "@/hooks/data/wishlist/useWishlist";
import useTranslation from "@/translation/useTranslation";
import Loading from "@/app/(adminDashboard)/loading";
import { CheckCircle, ShoppingBag } from "lucide-react";

function getUserIdForRecommendations(): number {
  if (typeof window === "undefined") return 1;
  
  let userId = localStorage.getItem("recommendation_user_id");
  if (!userId) {
    userId = String(Math.floor(Math.random() * 100000) + 1);
    localStorage.setItem("recommendation_user_id", userId);
  }
  return parseInt(userId, 10);
}

function transformRecommendationToProduct(rec: ComplementaryRecommendation) {
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
    reason: rec.reason,
  };
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderCompleteContent />
    </Suspense>
  );
}

function OrderCompleteContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id");
  const [userId, setUserId] = useState<number>(1);
  
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const { data: translation } = useTranslation();

  useEffect(() => {
    setUserId(getUserIdForRecommendations());
  }, []);

  const { data: complementaryResponse, isLoading, error } = useQuery({
    queryKey: ["complementary-products", userId, productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const result = await getComplementaryProducts({
        user_id: userId,
        purchased_product_id: parseInt(productId),
        limit: 8,
      });
      
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!productId && userId > 0,
  });

  const products = (complementaryResponse?.recommendations || [])
    .map((rec) => {
      const product = transformRecommendationToProduct(rec);
      return formatProduct(product, {
        cart: cart?.data?.map((item: any) => item.id),
        wishlist: wishlist?.data,
      });
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {translation?.lang["Order created successfully"] || "Order Placed Successfully!"}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/Orders"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              View My Orders
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {productId && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {translation?.lang["We recommend"] || "Customers Also Bought"}
              </h2>
              <p className="text-gray-600">
                Complete your collection with these related products
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Unable to load recommendations</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No recommendations available at this time</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ComplementaryProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ComplementaryProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.imgUrl ? (
          <Image
            src={product.imgUrl}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        {product.discount > 0 && (
          <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{product.discount}%
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600">
          {product.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {product.price_after_discount || product.price} TND
          </span>
          {product.discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              {product.price} TND
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
