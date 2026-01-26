"use server";

import deleteData from "@/api/deleteData";

export async function deleteOrder(id: number) {
  const { error } = await deleteData<"orders">({
    tableName: "orders",
    match: { id },
  });
  if (error) return { error: error.message };
  return { error: null };
}
