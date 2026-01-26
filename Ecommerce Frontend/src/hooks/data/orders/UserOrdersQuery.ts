import getData from "@/api/getData";

export default function UserOrdersQuery() {
  return {
    queryKey: ["orders", { user: true }],
    queryFn: async () => {
      const { data, error } = await getData<"orders">({
        tableName: "orders",
        user: true,
        sort: { column: "created_at", ascending: false },
      });
      return { data, error };
    },
  };
}
