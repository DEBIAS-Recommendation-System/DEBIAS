"use server";
import { QueriesConfig } from "@/constants/QueriesConfig";
import { populatedWishlistQuery } from "@/hooks/data/wishlist/populatedWishlistQuery";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import React from "react";
export default async function WishlistHydration({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient(QueriesConfig);
  await Promise.all([
    queryClient.prefetchQuery(
      populatedWishlistQuery({
        page: 1,
        limit: 8,
      }),
    ),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
