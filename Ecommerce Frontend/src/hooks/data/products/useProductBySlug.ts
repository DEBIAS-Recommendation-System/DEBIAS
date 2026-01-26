"use client";
import { useQuery } from "@tanstack/react-query";
import useCart from "../cart/useCart";
import { formatProduct } from "./formatProducts";
import useWishlist from "../wishlist/useWishlist";
import { productBySlugQuery } from "./productBySlugQuery";

export default function useProductBySlug(slug: string) {
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const query = useQuery(productBySlugQuery({ slug }));
  return {
    ...query,
    data: {
      ...query.data,
      data: formatProduct(query.data?.data?.[0] ?? null, {
        cart: cart?.data?.map((item) => item.id),
        wishlist: wishlist?.data,
      }),
    },
  };
}
