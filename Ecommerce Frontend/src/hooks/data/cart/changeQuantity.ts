import handleProductQuantity from "@/actions/Cart/handleProductQuantity";
import { useToast } from "@/hooks/useToast";
import { IProduct, QueryReturnType } from "@/types/database.tables.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useTranslation from "@/translation/useTranslation";
import { cartQuery } from "./cartQuery";

export default function useChangeQuantity(product: IProduct | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  return useMutation({
    mutationFn: async (quantity: number) => {
      if (!product) {
        throw new Error(translation?.lang["Product not found"]);
      }
      if (quantity < 1) {
        throw new Error(translation?.lang["Quantity must be at least 1"]);
      }
      if (product.stock < quantity) {
        throw new Error(translation?.lang["Not enough stock"]);
      }
      const { error } = await handleProductQuantity(product.id, quantity);
      if (error) throw new Error(error);
    },
    onMutate: async (quantity) => {
      const queryKey = cartQuery()["queryKey"];
      type queryReturnType = QueryReturnType<typeof cartQuery>;
      await queryClient.cancelQueries({
        queryKey,
      });
      const previousCart = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(
        queryKey,
        (old: queryReturnType): queryReturnType => {
          const changedProduct = old.data?.find((e) => e.id === product?.id);
          if (!changedProduct) {
            return old;
          }
          return {
            ...old,
            data: [
              ...(old.data?.filter((e) => e.id !== product?.id) ?? []),
              {
                ...changedProduct,
                quantity,
              },
            ],
          };
        },
      );
      return previousCart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error, _, previousCart) => {
      queryClient.setQueryData(cartQuery()["queryKey"], previousCart);
      toast.error(error.message);
    },
  });
}
