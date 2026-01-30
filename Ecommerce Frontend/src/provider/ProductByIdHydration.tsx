"use server";
import { QueriesConfig } from "@/constants/QueriesConfig";
import { productByIdQuery } from "@/hooks/data/products/productByIdQuery";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import React from "react";
export default async function ProductByIdHydration({
  children,
  productId,
}: {
  children: React.ReactNode;
  productId: string;
}) {
  const queryClient = new QueryClient(QueriesConfig);
  await Promise.all([
    queryClient.prefetchQuery(
      productByIdQuery({
        productId,
      }),
    ),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
