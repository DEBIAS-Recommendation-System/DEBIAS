import getData from "@/api/getData";
import { Tables } from "@/types/database.types";

export interface OrderProduct extends Tables<"order_products"> {
  products: Tables<"products">;
}

export default function OrderByIdQuery(id: number | null) {
  return {
    queryKey: ["orders", { id, user: true }],
    queryFn: async () => {
      if (!id) return;
      const { data, error } = await getData<"orders">({
        tableName: "orders",
        user: true,
        match: { id },
      });
      const order = data ? data[0] : null;
      const { data: orderProducts, error: error2 } = await getData<
        "order_products",
        OrderProduct[]
      >({
        tableName: "order_products",
        column: "*, products(*)",
        match: { order_id: id },
      });
      return { data: { order, orderProducts }, error };
    },
  };
}
