import getOrderProducts from "@/actions/Order products/getOrderProducts";

export const orderProductsQuery = ({ order_id }: { order_id: number }) => ({
  queryKey: ["order_products", { order_id }],
  queryFn: async () => getOrderProducts({ order_id }),
});
