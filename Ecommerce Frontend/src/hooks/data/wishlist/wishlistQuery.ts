import getData from "@/api/getData";

const wishlistQuery = () => ({
  queryKey: [
    "wishlist",
    {
      user: true,
    },
  ],
  queryFn: async () => {
    const res = await getData<"wishlist">({
      tableName: "wishlist",
      user: true,
    });
    return { ...res, data: res.data?.map((e) => e.product_id) };
  },
});

export { wishlistQuery };
