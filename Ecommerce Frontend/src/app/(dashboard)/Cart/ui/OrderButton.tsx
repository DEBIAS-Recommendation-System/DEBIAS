"use client";
import { useState } from "react";
import useCart from "@/hooks/data/cart/useCart";
import useTranslation from "@/translation/useTranslation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { cartsApi } from "@/api/fastapi";
import { TokenManager } from "@/api/fastapi/apiClient";
import { trackEvent, getUserId } from "@/utils/eventTracking";
import { getSessionId } from "@/utils/session";
import { useToast } from "@/hooks/useToast";

export default function OrderButton() {
  const { data: translation } = useTranslation();
  const { data: cart } = useCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    const accessToken = TokenManager.getAccessToken();
    
    if (!accessToken) {
      toast.error("Please login to checkout");
      return;
    }

    if (!cart.data || cart.data.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);
    console.log("🛒 [CHECKOUT] Starting checkout process...");
    console.log("🛒 [CHECKOUT] Cart items:", cart.data);
    console.log("🛒 [CHECKOUT] Cart ID:", cart.cartId);

    try {
      const sessionId = getSessionId();
      const userId = getUserId();

      // Send purchase event for each cart item
      console.log("🛒 [CHECKOUT] Sending purchase events...");
      const purchasePromises = cart.data.map(async (item) => {
        console.log(`🛒 [CHECKOUT] Sending purchase event for product ${item.product_id}`);
        return trackEvent({
          event_type: "purchase",
          product_id: item.product_id,
          user_session: sessionId,
          user_id: userId ?? undefined,
        });
      });

      const purchaseResults = await Promise.all(purchasePromises);
      console.log("🛒 [CHECKOUT] Purchase events results:", purchaseResults);

      // Clear the cart using the cartId from useCart hook
      if (cart.cartId) {
        console.log("🛒 [CHECKOUT] Clearing cart:", cart.cartId);
        
        // Clear the cart by updating it with empty items
        await cartsApi.update(cart.cartId, { cart_items: [] });
        console.log("🛒 [CHECKOUT] Cart cleared successfully");
      } else {
        // Fallback: fetch the cart and clear it
        const cartsResponse = await cartsApi.getAll({ limit: 1 });
        
        if (cartsResponse.data && cartsResponse.data.length > 0) {
          const activeCart = cartsResponse.data[0];
          console.log("🛒 [CHECKOUT] Clearing cart (fallback):", activeCart.id);
          
          await cartsApi.update(activeCart.id, { cart_items: [] });
          console.log("🛒 [CHECKOUT] Cart cleared successfully (fallback)");
        }
      }

      // Clear localStorage cart
      localStorage.setItem("cart", "[]");

      // Invalidate cart queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["carts"] });

      // Show success notification
      toast.success("🎉 Order placed successfully! Thank you for your purchase.");

      console.log("🛒 [CHECKOUT] Checkout completed successfully!");

    } catch (error) {
      console.error("🛒 [CHECKOUT] Error during checkout:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.data?.length === 0) {
    return (
      <Link
        href="/products"
        className="w-full cursor-not-allowed rounded-lg bg-color1 p-3 text-center text-xl font-semibold text-white transition-all duration-300 hover:bg-gray-800"
      >
        {translation?.lang["Order Some Products first"]}
      </Link>
    );
  }
  if (cart.total_products_quantity === 0) {
    return (
      <div className="w-full rounded-lg bg-gray-600 p-3 text-center text-xl font-semibold text-white transition-all duration-300 hover:bg-gray-800">
        {translation?.lang["Select a quantity"]}
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isProcessing}
      className={`w-full rounded-lg p-3 text-center text-xl font-semibold text-white transition-all duration-300 ${
        isProcessing 
          ? "bg-gray-400 cursor-not-allowed" 
          : "bg-color1 hover:bg-red-400"
      }`}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        translation?.lang["Order {PRICE} TND"]?.replace(
          "{PRICE}",
          cart.total_after_discount.toFixed(2),
        ) || `Order ${cart.total_after_discount.toFixed(2)} TND`
      )}
    </button>
  );
}
