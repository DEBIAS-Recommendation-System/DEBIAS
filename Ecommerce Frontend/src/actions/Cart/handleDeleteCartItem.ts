"use server";

import getUser from "../../api/getUser";
import deleteData from "../../api/deleteData";

export default async function handleDeleteCartItem(id: string) {
  const {
    data: { user },
  } = await getUser();
  const { error } = await deleteData<"cart">({
    tableName: "cart",
    match: { user_id: user.id, product_id: id },
  });
  if (error) return { error: error.message };
  return { error: null };
}
