"use server";
import { QueriesConfig } from "@/constants/QueriesConfig";
import OrderByIdQuery from "@/hooks/data/orders/orderWithIdQuery";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import React from "react";
export default async function OrderByIdHydration({
  children,
  id,
}: {
  children: React.ReactNode;
  id: number;
}) {
  const queryClient = new QueryClient(QueriesConfig);
  await Promise.all([queryClient.prefetchQuery(OrderByIdQuery(id))]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
