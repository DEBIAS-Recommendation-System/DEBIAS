"use client";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/utils/eventTracking";
import { getSessionId } from "@/utils/session";

export function useAddToCart() {
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();

  const addToCart = async ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const itemIndex = cart.findIndex((item: { product_id: string }) => item.product_id === product_id);
    
    const isNewItem = itemIndex === -1;
    
    if (isNewItem) {
      cart.push({ product_id, quantity });
      toast.success(translation?.lang["Item added to cart"] || "Item added to cart");
    } else {
      cart[itemIndex].quantity += quantity;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    queryClient.invalidateQueries({ queryKey: ["cart"] }); 
    queryClient.invalidateQueries({ queryKey: ["products"] }); 

    // Send cart event to Neo4j (client-side tracking)
    const sessionId = getSessionId();
    const productIdNum = parseInt(product_id);
    
    if (!isNaN(productIdNum)) {
      console.log("🛒 [CART EVENT] Adding product to cart:", {
        product_id: productIdNum,
        session_id: sessionId,
      });
      
      trackEvent({
        event_type: "cart",
        product_id: productIdNum,
        user_session: sessionId,
      });
    }
  };

  return {
    addToCart,
  };
}
