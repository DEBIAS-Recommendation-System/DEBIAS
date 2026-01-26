import getWishlist from "@/actions/wishlist/getWishlist";
import { infinityPagination } from "@/helpers/infinityPagination";
export interface UserWishlistQueryType {
  page: number;
  limit: number;
}
const populatedWishlistQuery = (args: UserWishlistQueryType) => ({
  queryKey: [
    "wishlist",
    {
      user: true,
      ...args,
    },
  ],
  queryFn: async () => {
    const [data, countData] = await Promise.all([
      getWishlist({
        tableName: "wishlist",
        user: true,
        pagination: {
          page: args.page,
          limit: args.limit,
        },
      }),
      getWishlist({
        tableName: "wishlist",
        user: true,
        count: { count: "exact", head: true },
        ...args,
        pagination: {
          page: args.page,
          limit: args.limit,
        },
      }).then((res) => ({
        count: res.count,
        error: res.error,
      })),
    ]);
    return {
      ...infinityPagination(data?.data ?? [], {
        page: args.page,
        limit: args.limit,
        total_count: countData.count ?? 0,
      }),
      error: data.error || countData.error,
    };
  },
});

export { populatedWishlistQuery };
