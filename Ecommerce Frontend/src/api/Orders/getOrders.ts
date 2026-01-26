"use server";
import {  Enums, Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase";

export type getOrdersParams = {
  match?: Partial<Tables<"orders">>;
  date?: {
    from: string;
    to: string;
  };
  columns?: (keyof Tables<"orders">)[];
  status?: Enums<"status_type_enum">;
  count?: {
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
  };
  search?: { columns: (keyof Tables<"orders">)[]; value: string };
  sort?: {
    column: keyof Tables<"orders">;
    ascending: boolean;
  };
  pagination?: {
    limit: number;
    page: number;
  };
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
};

export default async function getOrders({
  date,
  status,
  match,
  columns,
  count = {},
  sort,
  pagination,
  search,
  filter,
}: getOrdersParams) {
  const supabase = createClient();

  let query = supabase
    .from("orders")
    .select(columns?.join(",") ?? "*", count);

  if (date) {
    query = query.gte("created_at", date.from).lte("created_at", date.to);
  }

  if (filter) {
    query = query.filter(filter.column, filter.operator || "eq", filter.value);
  }

  if (search) {
    query = query.or(
      search.columns.map((column) => `${column}.ilike.%${search.value}%`).join(",")
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (match) {
    query = query.match(match);
  }

  if (sort) {
    query = query.order(sort.column, { ascending: sort.ascending });
  }

  if (pagination) {
    const start =
      pagination.page === 1 ? 0 : (pagination.page - 1) * pagination.limit;
    const end =
      pagination.page === 1
        ? pagination.limit - 1
        : start + pagination.limit - 1;
    query = query.range(start, end);
  }

  const { data, error, count: items_count } = await query;
  return {
    data: data as unknown as Tables<"orders">[] | null, // Ensure it returns an array
    error,
    count: items_count,
  };
}
