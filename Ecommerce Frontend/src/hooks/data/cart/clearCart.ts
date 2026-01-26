"use client";
import getSession from "@/api/getSession";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCart from "./useCart";
import deleteData from "@/api/deleteData";
import useTranslation from "@/translation/useTranslation";

export function useClearCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: translation } = useTranslation();
  const { data: oldCart } = useCart();
  return useMutation({
    mutationFn: async () => {
      const { session } = await getSession();
      if (!session) {
        throw new Error(translation?.lang["User is not authenticated"]);
      }
      if (!oldCart?.data) {
        throw new Error(translation?.lang["User cart not found"]);
      }
      // await deleteData({
      //   tableName: "cart",
      //   matchInArray: {
      //     column: "product_id",
      //     in: oldCart.data,
      //   },
      // });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
