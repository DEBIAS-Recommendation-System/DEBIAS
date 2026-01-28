"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import useTranslation from "@/translation/useTranslation";
import CustomSwiper from "@/app/ui/Swiper";
import useProductBySlug from "@/hooks/data/products/useProductBySlug";
import { WishlistHart } from "@/app/(dashboard)/ui/home/ui/ProductsSection/WishListHart";
import AddToCartBtn from "@/app/(dashboard)/ui/home/ui/ProductsSection/AddToCartBtn";

export default function ProductDetails() {
  const { slug } = useParams();
  const { data: translation } = useTranslation();
  const decodedSlug = decodeURIComponent(Array.isArray(slug) ? slug[0] : slug);
  const { data } = useProductBySlug(String(decodedSlug));
  const product = data?.data;
  return (
    <div dir={translation?.default_language ==="ar" ? "rtl" : "ltr"}   className="flex flex-row gap-20 py-8 dark:bg-gray-800 md:flex-col">
      <div className="mx-auto flex max-w-6xl flex-row gap-20 px-4 sm:px-6 lg:px-8">
        <div className="-mx-4 flex flex-row items-center gap-16 max-[1150px]:gap-10 max-[700px]:flex-col">
          <div className="px-4">
            <div className="rounded-lg dark:bg-gray-700 [&_.swiper-button-next]:text-color1 [&_.swiper-button-prev]:text-color1 [&_.swiper-pagination-bullet-active]:bg-color1">
              <CustomSwiper
                className="w-full max-w-[30rem] max-[880px]:size-[25rem] max-[785px]:size-[20rem]"
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
                ].map((url) => (
                  <Image
                    key={url}
                    className="object-scale-down"
                    width={1000}
                    height={1000}
                    src={url ?? ""}
                    alt="Product Image"
                  />
                ))}
              />
            </div>
          </div>
          <div dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} className="flex flex-col items-start justify-start self-center px-4 max-[700px]:self-start">
            <div className="relative flex flex-row gap-2">
              <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">
                {product?.title ?? ""}
              </h2>
              <WishlistHart
                variant="relative"
                product_id={product?.id}
                isInWishlist={product?.isInWishlist}
              />
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {product?.subtitle ?? ""}
            </p>
            <div className="mb-4 flex flex-col items-start gap-2">
              <div className=" flex flex-row items-center gap-2">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {translation?.lang["price"]}:
                </span>
                <div className="flex flex-row items-center justify-start gap-4">
                  {!!product?.discount && (
                    <span className="text-color8">
                      {product.price_after_discount} TND
                    </span>
                  )}
                  {!!product?.discount ? (
                    <del>{product.price} TND</del>
                  ) : (
                    <span>{product?.price} TND</span>
                  )}
                </div>
              </div>
              <div className="flex flex-row items-center gap-2">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {translation?.lang["Availability"]}:
                </span>
                <span
                  className={`text-gray-600 dark:text-gray-300 ${
                    product?.available ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {product?.available
                    ? translation?.lang["In Stock"]
                    : translation?.lang["Out of Stock"]}
                </span>
              </div>
            </div>
            <div className="mb-4 flex">
              {product?.available && (
                <AddToCartBtn
                  product_id={product?.id ?? ""}
                  isInCart={product?.isInCart}
                  available={product?.available}
                  className="relative bottom-0 left-0 -ml-3 flex h-[2.5rem] w-[10rem] items-center justify-center opacity-100"
                />
              )}
            </div>
            <div>
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {translation?.lang["Product Description"]}:
              </span>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {product?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
