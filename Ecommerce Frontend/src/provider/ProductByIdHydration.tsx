"use server";
import { QueriesConfig } from "@/constants/QueriesConfig";
import { productBySlugQuery } from "@/hooks/data/products/productBySlugQuery";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import React from "react";
export default async function ProductByIdHydration({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug: string;
}) {
  const queryClient = new QueryClient(QueriesConfig);
  await Promise.all([
    queryClient.prefetchQuery(
      productBySlugQuery({
        slug,
      }),
    ),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
