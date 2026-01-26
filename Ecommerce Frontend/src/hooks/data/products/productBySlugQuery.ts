import getProducts from "@/actions/products/getProducts";

const productBySlugQuery = ({ slug }: { slug: string }) => ({
  queryKey: ["products", {slug}],
  queryFn: async () => {
    // Use the CSV-based getProducts function with slug match
    return await getProducts({
      tableName: "products",
      match: { slug },
    });
  },
  enabled: slug !== undefined && slug !== null && slug !== "undefined",
});

export { productBySlugQuery };
