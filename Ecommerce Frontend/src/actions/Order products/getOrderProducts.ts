"use server";

import getData from "../../api/getData";

export async function getOrderProducts({ order_id }: { order_id: number }) {
  return await getData({
    tableName: "order_products",
    match: { order_id },
  });
}

export default getOrderProducts;
