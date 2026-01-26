"use server";

import { createClient } from "@/lib/supabase";

export default async function productsIncome() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("stock, price, discount, wholesale_price")
    .gt("stock",0);
  type ProductRow = { stock: number; price: number; discount: number; wholesale_price: number };
  const totalIncome = (products as ProductRow[] | null)?.reduce((acc, product) => {
    const income = product.stock * ((product.price - product.discount) - product.wholesale_price);
    return acc + income;
  }, 0);

  return {
    totalIncome,
    error,
  };
}
