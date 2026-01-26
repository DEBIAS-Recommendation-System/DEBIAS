"use client";
import { useQuery } from "@tanstack/react-query";
import OrderByIdQuery from "./orderWithIdQuery";

export default function useOrdersById(orderId: number) {
  return useQuery(OrderByIdQuery(orderId));
}
