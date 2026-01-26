"use client";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { useQueryClient } from "@tanstack/react-query";

export function useAddToCart() {
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();

  const addToCart = ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const itemIndex = cart.findIndex((item: { product_id: string }) => item.product_id === product_id);
    if (itemIndex === -1) {
      cart.push({ product_id, quantity });
      toast.success(translation?.lang["Item added to cart"] || "Item added to cart");
    } else {
      cart[itemIndex].quantity += quantity;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    queryClient.invalidateQueries({ queryKey: ["cart"] }); 
    queryClient.invalidateQueries({ queryKey: ["products"] }); 

    


  };

  return {
    addToCart,
  };
}
