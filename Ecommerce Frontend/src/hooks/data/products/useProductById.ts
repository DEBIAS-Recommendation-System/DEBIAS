"use client";
import { useQuery } from "@tanstack/react-query";
import useCart from "../cart/useCart";
import { formatProduct } from "./formatProducts";
import useWishlist from "../wishlist/useWishlist";
import { productByIdQuery } from "./productByIdQuery";

export default function useProductById(productId: string) {
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const query = useQuery(productByIdQuery({ productId }));
  return {
    ...query,
    data: {
      ...query.data,
      data: formatProduct(query.data?.data ?? null, {
        cart: cart?.data?.map((item) => item.id),
        wishlist: wishlist?.data,
      }),
    },
  };
}
