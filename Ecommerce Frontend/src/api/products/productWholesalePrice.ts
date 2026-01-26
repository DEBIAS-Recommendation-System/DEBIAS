"use server";

import { createClient } from "@/lib/supabase";

export default async function productsWholeSalePrice() {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("stock, wholesale_price")
    .gt("stock",0);
  type ProductRow = { stock: number; wholesale_price: number };
  const totaleWholesalePrice = (products as ProductRow[] | null)?.reduce((acc, product) => {
    const productWholeSalePrice = product.stock * product.wholesale_price;
    return acc + productWholeSalePrice;
  }, 0);

  return {
    totaleWholesalePrice,
    error,
  };
}
