"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/app/ui/Spinner";
import useTranslation from "@/translation/useTranslation";
import { DiscountTypeEnum, IProduct } from "@/types/database.tables.types";
import { Tables } from "@/types/database.types";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CartItem({
  product,
}: {
  product: Tables<"products"> & { quantity: number };
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(product.quantity);
  const [isDeleting, setIsDeleting] = useState(false);
  const available = (product.stock - quantity) >= 0;
  const price_after_discount = product.price - product.discount;
  const { data: translation } = useTranslation();
  const updateCartInLocalStorage = async(updatedCart: any[]) => {
   localStorage.setItem("cart", JSON.stringify(updatedCart));
    queryClient.invalidateQueries({ queryKey: ["cart"] }); 
  };
  const getCartFromLocalStorage = () => {
    if (typeof window !== "undefined") {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    }
    return [];
  };

const changeQuantity = (newQuantity: number) => {
  const cart = getCartFromLocalStorage();
  const updatedCart = cart.map((item: any) => {
    if ( item.product_id === product.id) {
      return { ...item, quantity: newQuantity };
    }
    return item;
  });
  setQuantity(newQuantity);
  updateCartInLocalStorage(updatedCart);
  queryClient.invalidateQueries({ queryKey:["cart"] });
};

const removeItem = () => {
  setIsDeleting(true);
  const cart = getCartFromLocalStorage();
  const updatedCart = cart.filter((item: any) => item.product_id !== product.id);
  updateCartInLocalStorage(updatedCart);
  setIsDeleting(false);
};


  return (
    <div className="w-[95%] border-2 border-solid transition-all duration-200 hover:w-[97%] hover:shadow-md max-[480px]:w-full">
      <Link
        className="flex cursor-pointer items-center justify-between"
        href={`/products/${product?.id || product?.product_id}`}
      >
        <div className="flex w-full gap-2 max-[390px]:gap-1 sm:flex-row md:flex-col md:items-center lg:flex-row">
          <Image
            src={product?.imgUrl ?? ""}
            alt="item_img"
            className="h-[7rem] w-[7rem] p-3 max-[390px]:p-0 md:h-[14rem] md:w-[14rem] lg:h-[7rem] lg:w-[7rem]"
            width={500}
            height={500}
          />
          <div className="flex flex-1 justify-between md:w-full md:px-5 lg:px-0">
            <div className="max-[390px]:max pt-7">
              <div
                className={`line-clamp-1 ${available ? "" : "text-red-600"}`}
              >
                {product?.title}
              </div>
              <div className={`${available ? "text-green-500" : "text-color1"}`}>
                {available
                  ? translation?.lang["In Stock"]
                  : translation?.lang["Out of Stock"]}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-3 max-[520px]:text-sm">
              <div className="text-right">
                {price_after_discount * quantity} TND
              </div>
              {!!product?.discount && product.discount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="min-w-max text-gray-600 line-through">
                    {product.price * quantity} TND
                  </div>
                  <div className="min-w-max bg-red-100 p-1 text-red-600">
                    {product.discount*quantity}{" "}
                    {product.discount_type === DiscountTypeEnum.PERCENTAGE
                      ? "%"
                      : "dt"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      <hr />
      <div className="flex items-center justify-between p-4">
        <button
          onClick={removeItem}
          className="flex min-w-[6rem] items-center justify-center rounded-xl border-2 bg-color1 p-2 text-white transition-all duration-300 hover:border-color1 hover:bg-white hover:text-color1"
        >
          {isDeleting ? (
            <Spinner className="size-6" />
          ) : (
            translation?.lang["Delete"]
          )}
        </button>
        <div className="flex gap-7">
          <button
            className="h-[2rem] w-[2rem] rounded-md bg-red-100 text-center"
            onClick={() => changeQuantity(quantity - 1)}
            disabled={quantity <= 1}
          >
            -
          </button>
          <div>{quantity}</div>
          <button
            className="h-[2rem] w-[2rem] rounded-md bg-red-100 text-center"
            onClick={() => changeQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
