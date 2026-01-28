"use client";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, ProductsQueryType } from "./productsQuery";

export default function useProducts(args: ProductsQueryType) {
  const query = useQuery(
    productsQuery({
      ...args,
    }),
  );

  // Return products without cart/wishlist formatting to avoid unnecessary queries
  // Format on the component level if needed
  return query;
}
