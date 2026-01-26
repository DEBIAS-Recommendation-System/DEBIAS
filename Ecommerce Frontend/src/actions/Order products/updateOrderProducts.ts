"use server";

import { TablesUpdate } from "@/types/database.types";
import updateData from "@/api/updateData";

export async function updateOrderProducts(
  payload: TablesUpdate<"order_products">,
  id: number,
) {
  return await updateData({
    tableName: "order_products",
    payload,
    match: { id },
  });
}
