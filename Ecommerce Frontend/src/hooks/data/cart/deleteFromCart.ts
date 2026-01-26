import handleDeleteCartItem from "@/actions/Cart/handleDeleteCartItem";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { IProduct } from "@/types/database.tables.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useDeleteFromCart(product: IProduct | null) {
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!product) {
        throw new Error(translation?.lang["Product not found"]);
      }
      const { error } = await handleDeleteCartItem(product.id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast.success(
        translation?.lang["Item deleted successfully"] ??
          "Item deleted successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => toast.error(error.message),
  });
}
