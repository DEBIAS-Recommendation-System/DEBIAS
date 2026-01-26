import getProfile from "@/api/getProfile";
const userQuery = () => ({
  queryKey: ["user"],
  queryFn: async () => {
    return await getProfile();
  },
});

export { userQuery };
