"use client";
import deleteData from "@/api/deleteData";
import getSession from "@/api/getSession";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistQuery } from "./wishlistQuery";
import useTranslation from "@/translation/useTranslation";
import { QueryReturnType } from "@/types/database.tables.types";

export function useRemoveFromWishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: translation } = useTranslation();
  return useMutation({
    onMutate(variables) {
      const queryKey = wishlistQuery()["queryKey"];
      type queryReturnType = QueryReturnType<typeof wishlistQuery>;
      const previousValue = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: queryReturnType) => {
        return {
          data: old?.data?.filter((id) => id !== variables.product_id),
        };
      });
      return previousValue;
    },
    mutationFn: async ({ product_id }: { product_id: string }) => {
      const { session } = await getSession();
      if (!session) {
        throw new Error(translation?.lang["User is not authenticated"]);
      }
      await deleteData<"wishlist">({
        tableName: "wishlist",
        match: { product_id, user_id: session.user.id },
      });
    },
    onError: (error, _, prev) => {
      toast.error(error.message);
      queryClient.setQueryData(wishlistQuery()["queryKey"], prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
