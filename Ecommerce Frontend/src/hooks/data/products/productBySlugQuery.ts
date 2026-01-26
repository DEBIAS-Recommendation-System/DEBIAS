import getData from "@/api/getData";
const productBySlugQuery = ({ slug }: { slug: string }) => ({
  queryKey: ["products", {slug}],
  queryFn: async () => {
    return await getData<"products">({
      tableName: "products",
      match: { slug },
    });
  },
  enabled: slug !== undefined && slug !== null && slug !== "undefined",
});

export { productBySlugQuery };
