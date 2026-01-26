"use server";
import deleteData from "@/api/deleteData";

export default async function clearCart(id: string) {
  const { error } = await deleteData<"cart">({
    tableName: "cart",
    match: { user_id: id },
  });
  if (error) return { error: error.message };
  return { error: null };
}
