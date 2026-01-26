"use client";
import { useQuery } from "@tanstack/react-query";
import { Enums, Tables } from "@/types/database.types";
import { ordersQuery } from "./ordersQuery";

export default function useOrders({
  columns,
  date,
  status,
  pagination,
  sort,
  search,
  filter,
}: {
  columns?: (keyof Tables<"orders">)[];
  date?: {
    from: string;
    to: string;
  };
  status?: Enums<"status_type_enum">;
  pagination?:{
    limit: number;
    page: number;
  };
  sort?: {
    ascending: boolean;
    column: keyof Tables<"orders">;
  };

  search?: { columns: (keyof Tables<"orders">)[]; value: string };
  filter?: {
    column: keyof Tables<"orders">;
    value: string;
    operator?:
      | "eq"
      | "neq"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "ilike"
      | "not_ilike"
      | "in"
      | "not_in";
  };
}) {
  return useQuery(ordersQuery({status, pagination, sort, search,filter ,date ,columns}));
}
