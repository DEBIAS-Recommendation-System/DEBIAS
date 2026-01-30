import getProductById from "@/actions/products/getProductById";

const productByIdQuery = ({ productId }: { productId: string }) => ({
  queryKey: ["product", productId],
  queryFn: async () => {
    return await getProductById(productId);
  },
  enabled: productId !== undefined && productId !== null && productId !== "undefined",
});

export { productByIdQuery };
