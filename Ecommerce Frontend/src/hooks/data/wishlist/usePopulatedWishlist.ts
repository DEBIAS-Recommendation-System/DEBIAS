"use client";
import { useQuery } from "@tanstack/react-query";
import {
  populatedWishlistQuery,
  UserWishlistQueryType,
} from "./populatedWishlistQuery";
import { formatProduct } from "../products/formatProducts";
import useWishlist from "./useWishlist";
import { useEffect, useState } from "react";

export default function usePopulatedWishlist(args: UserWishlistQueryType) {
  const [cartProductIds, setCartProductIds] = useState<string[]>([]);
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const productIds = storedCart.map((item: { product_id: string }) => item.product_id);
    setCartProductIds(productIds);
  }, []);
  const { data: wishlist } = useWishlist();
  const query = useQuery(
    populatedWishlistQuery({
      ...args,
    }),
  );
  return {
    ...query,
    data: {
      ...query.data,
      data: query.data?.data?.map((e) => {
        const formattedProduct = formatProduct(e?.products ?? null, {
          cart: cartProductIds,  
          wishlist: wishlist?.data ?? [],  
        });
        return {
          ...e,
          products: formattedProduct,
        };
      }),
    },
  };
}
