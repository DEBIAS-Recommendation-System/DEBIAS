"use server";
import { createClient } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import { paginateQuery } from "@/helpers/paginateQuery";
import getSession from "@/api/getSession";

export default async function getWishlist({
  tableName,
  count = {},
  sort,
  pagination,
  search,
  user,
}: {
  user?: boolean;
  tableName: "wishlist";
  count?: {
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
  };
  search?: { column: keyof Tables<"wishlist">; value: string };
  sort?: {
    column: keyof Tables<"wishlist">;
    ascending: boolean;
  };
  pagination?: {
    limit: number;
    page: number;
  };
}) {
  const supabase = await createClient();
  let query = supabase.from(tableName).select(
    `*, 
    products (*)`,
    count,
  );
  if (sort) {
    query = query.order(sort.column as string, { ascending: sort.ascending });
  }
  if (search) {
    query = query.ilike(search.column as string, `%${search.value}%`);
  }
  if (pagination) {
    const { start, end } = paginateQuery(pagination);
    query = query.range(start, end);
  }
  if (user) {
    const { session, error: sessionErr } = await getSession();
    const user_id = session?.user?.id;
    if (!user_id || sessionErr) {
      return {
        data: null,
        count: null,
        error: {
          message: "User not found",
          details: "User not found",
          hint: `User ${user_id} not found`,
          code: "404",
        },
      };
    }
    query = query.eq("user_id", user_id);
  }
  const { data, error, count: items_count } = await query;
  return {
    data: data as
      | (Tables<"wishlist"> & { products: Tables<"products"> })[]
      | null,
    error,
    count: items_count,
  };
}
