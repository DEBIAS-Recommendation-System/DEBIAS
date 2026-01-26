import { useQuery } from "@tanstack/react-query";
import UserOrdersQuery from "./UserOrdersQuery";

export default function useUserOrders() {
  const query = useQuery(UserOrdersQuery());
  return { ...query, data: query.data?.data };
}
