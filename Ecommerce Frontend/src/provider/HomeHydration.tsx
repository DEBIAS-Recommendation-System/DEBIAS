"use server";
import { QueriesConfig } from "@/constants/QueriesConfig";
import { productsQuery } from "@/hooks/data/products/productsQuery";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import React from "react";
export default async function HomeHydration({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient(QueriesConfig);
  // await Promise.all([
  //   queryClient.prefetchQuery(
  //     productsQuery({
  //       page: 1,
  //       limit: 8,
  //       sort: {
  //         column: "discount",
  //         ascending: false,
  //       },
  //     }),
  //   ),
  // ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
