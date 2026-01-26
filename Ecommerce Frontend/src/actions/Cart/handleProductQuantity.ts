"use server";

import getUser from "../../api/getUser";
import updateData from "@/api/updateData";

async function handleProductQuantity(id: string, quantity: number) {
  const {
    data: { user },
  } = await getUser();
  const { error } = await updateData<"cart">({
    tableName: "cart",
    payload: { quantity },
    match: { user_id: user.id, product_id: id },
  });
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export default handleProductQuantity;
