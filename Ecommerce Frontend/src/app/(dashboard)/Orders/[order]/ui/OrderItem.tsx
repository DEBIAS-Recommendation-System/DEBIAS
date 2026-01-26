import { OrderProduct } from "@/hooks/data/orders/orderWithIdQuery";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import useTranslation from "@/translation/useTranslation";
import Image from "next/image";
import React from "react";

export default function OrderItem({ item }: { item: OrderProduct }) {
  const { data: translation } = useTranslation();
  const formattedProduct = formatProduct(item.products, {
    cart: [],
    wishlist: [],
  });
  return (
    <div className="ite flex items-center rounded-md bg-white p-4 transition-all duration-200 hover:shadow-lg">
      <div className="flex flex-col gap-2">
        <Image
          src={formattedProduct?.image_url ?? ""}
          alt="img"
          width={150}
          className="rounded-md max-sm:w-[5rem]"
          height={150}
        />
        <h1 className="text-nowrap text-center text-lg">x {item.quantity}</h1>
      </div>
      <div className="flex w-full flex-col gap-2 p-4">
        <div className="flex w-full flex-1 justify-between">
          <div className="flex gap-2 font-semibold">
            <h1 className="text-nowrap">
              {translation?.lang["Total price"]} :{"   "}
              {(formattedProduct?.price_after_discount ?? 0) * item.quantity}
            </h1>
            <h1 className="text-gray-500 line-through">
              {(formattedProduct?.price ?? 0) * item.quantity}
            </h1>
            TND
          </div>
        </div>
        <h1 className="font-semibold">{formattedProduct?.title}</h1>
        <h1 className="text-sm text-gray-600">
          {formattedProduct?.description}
        </h1>
        {formattedProduct && formattedProduct.subtitle !== "" && (
          <h1 className="w-fit rounded-lg bg-pink-100 p-2 text-sm font-semibold text-color1">
            {formattedProduct?.subtitle}
          </h1>
        )}
      </div>
    </div>
  );
}
