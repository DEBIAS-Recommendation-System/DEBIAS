"use server";

import { createClient } from "@/lib/supabase";

export default async function getProductTitleAndWholesalePrice(productId : string) {
  const supabase = createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("title, wholesale_price")
    .eq("id" , productId)
    .single()

  if (error) {
    return { error: error.message };
  }
  const p = product as { title: string; wholesale_price: number } | null;
  if (!p) return { error: "Product not found" };
  return { title: p.title, wholesalePrice: p.wholesale_price };
}

