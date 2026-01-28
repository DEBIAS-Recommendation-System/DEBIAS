"use client";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, ProductsQueryType } from "./productsQuery";
import useCart from "../cart/useCart";
import { formatProduct } from "./formatProducts";
import useWishlist from "../wishlist/useWishlist";

/**
 * Use this hook when you need products formatted with cart/wishlist data
 * For better performance, use the regular useProducts hook if you don't need this data
 */
export default function useFormattedProducts(args: ProductsQueryType) {
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const cartProductIds = cart?.data?.map((item: any) => item.id) || [];
  const query = useQuery(
    productsQuery({
      ...args,
    }),
  );

  return {
    ...query,
    data: {
      ...query.data,
      data: query.data?.data?.map((product) =>
        formatProduct(product, {
          cart: cartProductIds, 
          wishlist: wishlist?.data,
        }),
      ),
    },
  };
}
