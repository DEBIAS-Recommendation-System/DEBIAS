"use server";
import { DiscountTypeEnum } from "./../../types/database.tables.types";
import { createClient } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import { paginateQuery } from "@/helpers/paginateQuery";
export default async function getCartProducts({
  tableName,
  count = {},
  pagination,
  productsIds
}: {
  productsIds: string[];
  tableName: "products";
  count?: {
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
  };
  pagination?: {
    limit: number;
    page: number;
  };
}) {
  const supabase = await createClient();
  let query = supabase.from(tableName).select("*", count).in("id", productsIds);
  if (pagination) {
    const { start, end } = paginateQuery(pagination);
    query = query.range(start, end);
  }

  const { data, error, count: items_count } = await query;
  return {
    data: data as Tables<"products">[] | null,
    error,
    count: items_count,
  };
}
