"use server";

import { TablesInsert } from "@/types/database.types";
import postData from "@/api/postData";

export async function postOrderProducts(
  payload: TablesInsert<"order_products">[],
) {
  return await postData({
    tableName: "order_products",
    payload,
  });
}
