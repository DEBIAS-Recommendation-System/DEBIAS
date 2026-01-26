"use client";
import getSession from "@/api/getSession";
import postData from "@/api/postData";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistQuery } from "./wishlistQuery";
import useTranslation from "@/translation/useTranslation";
import { QueryReturnType } from "@/types/database.tables.types";

export function useAddToWishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: translation } = useTranslation();
  return useMutation({
    onMutate(variables) {
      const queryKey = wishlistQuery()["queryKey"];
      type queryReturnType = QueryReturnType<typeof wishlistQuery>;
      const previousValue = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: queryReturnType) => {
        return { data: [...(old?.data ?? []), variables.product_id] };
      });
      return previousValue;
    },
    mutationFn: async ({ product_id }: { product_id: string }) => {
      const { session } = await getSession();
      if (!session) {
        throw new Error(translation?.lang["User is not authenticated"]);
      }
      await postData<"wishlist">({
        tableName: "wishlist",
        payload: [
          {
            product_id,
            user_id: session.user.id,
          },
        ],
      });
    },
    onError: (error, _, prev) => {
      toast.error(error.message);
      queryClient.setQueryData(wishlistQuery()["queryKey"], prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(
        translation?.lang["Item added to wishlist"] ?? "Item added to wishlist",
      );
    },
  });
}
