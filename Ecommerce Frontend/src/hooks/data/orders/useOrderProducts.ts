import { useQuery } from "@tanstack/react-query";
import { orderProductsQuery } from "./orderProductsQuery";

export const useOrderProducts = (order_id: number) => {
  return useQuery(orderProductsQuery({ order_id }));
};
