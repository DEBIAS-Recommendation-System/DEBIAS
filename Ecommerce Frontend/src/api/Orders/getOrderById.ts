"use server";
import { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase";

export default async function getOrdersById(orderId: number) {
  const supabase = await createClient();

  const { data: order_products, error: fetchError } = await supabase
    .from("order_products")
    .select("*")
    .eq("order_id", orderId);  
  if (fetchError) {
    return { error: fetchError.message };  
  }

  return order_products; 
}
