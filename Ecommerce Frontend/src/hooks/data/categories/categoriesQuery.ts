import getData from "@/api/getData";
const categoriesQuery = () => ({
  queryKey: ["categories"],
  queryFn: async () => {
    return await getData<"categories">({
      tableName: "categories",
    });
  },
});

export { categoriesQuery };
