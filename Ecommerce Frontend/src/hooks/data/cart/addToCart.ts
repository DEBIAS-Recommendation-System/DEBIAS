"use client";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent, getUserId } from "@/utils/eventTracking";
import { getSessionId } from "@/utils/session";
import { cartsApi } from "@/api/fastapi";
import { TokenManager } from "@/api/fastapi/apiClient";

export function useAddToCart() {
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();

  const addToCart = async ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
    console.log("🛒 [ADD TO CART] Starting add to cart for product:", product_id);
    
    // Update local storage cart (for UI consistency)
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const itemIndex = cart.findIndex((item: { product_id: string }) => item.product_id === product_id);
    
    const isNewItem = itemIndex === -1;
    
    if (isNewItem) {
      cart.push({ product_id, quantity });
    } else {
      cart[itemIndex].quantity += quantity;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("✅ [ADD TO CART] Updated localStorage cart:", cart);
    
    // If user is authenticated, sync with FastAPI backend cart
    const accessToken = TokenManager.getAccessToken();
    console.log("🔑 [ADD TO CART] Access token present:", !!accessToken);
    
    if (accessToken) {
      try {
        // Get user's carts to find the active cart
        console.log("📡 [ADD TO CART] Fetching user carts from API...");
        const cartsResponse = await cartsApi.getAll({ limit: 10 });
        console.log("📦 [ADD TO CART] Carts response:", cartsResponse);
        
        const productIdNum = parseInt(product_id);
        if (isNaN(productIdNum)) {
          console.error("❌ [ADD TO CART] Invalid product_id:", product_id);
          throw new Error("Invalid product ID");
        }
        
        // Check if user has any carts
        if (cartsResponse.data && cartsResponse.data.length > 0) {
          // Update the existing cart (use the first/active cart)
          const activeCart = cartsResponse.data[0];
          console.log("📝 [ADD TO CART] Found active cart:", activeCart.id);
          
          const existingItems = activeCart.cart_items || [];
          
          // Check if product already exists in cart
          const existingItemIndex = existingItems.findIndex(
            (item) => item.product_id === productIdNum
          );
          
          let updatedItems;
          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            console.log("📝 [ADD TO CART] Product exists in cart, updating quantity");
            updatedItems = existingItems.map((item, index) => 
              index === existingItemIndex 
                ? { product_id: item.product_id, quantity: item.quantity + quantity }
                : { product_id: item.product_id, quantity: item.quantity }
            );
          } else {
            // Add new item to existing cart
            console.log("📝 [ADD TO CART] Adding new product to existing cart");
            updatedItems = [
              ...existingItems.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
              { product_id: productIdNum, quantity }
            ];
          }
          
          console.log("📤 [ADD TO CART] Updating cart with items:", updatedItems);
          const updateResponse = await cartsApi.update(activeCart.id, { cart_items: updatedItems });
          console.log("✅ [ADD TO CART] Cart updated successfully:", updateResponse);
        } else {
          // No cart exists - create a new cart for this user with this item
          console.log("🆕 [ADD TO CART] No existing cart found, creating new cart...");
          const createResponse = await cartsApi.create({
            cart_items: [{ product_id: productIdNum, quantity }]
          });
          console.log("✅ [ADD TO CART] New cart created successfully:", createResponse);
        }
        
        // Show success toast only after backend sync succeeds
        toast.success(translation?.lang["Item added to cart"] || "Item added to cart");
      } catch (error: unknown) {
        // Log detailed error information
        console.error("❌ [ADD TO CART] Failed to sync with FastAPI cart:", error);
        
        // Try to extract error message from axios error
        let errorMessage = "Failed to sync cart";
        if (error && typeof error === 'object') {
          const axiosError = error as { response?: { data?: { detail?: string }, status?: number }, message?: string };
          if (axiosError.response?.data?.detail) {
            errorMessage = axiosError.response.data.detail;
            console.error("❌ [ADD TO CART] Backend error:", errorMessage);
          } else if (axiosError.response?.status) {
            console.error("❌ [ADD TO CART] HTTP Status:", axiosError.response.status);
          } else if (axiosError.message) {
            errorMessage = axiosError.message;
          }
        }
        
        // Still show toast since localStorage was updated
        if (isNewItem) {
          toast.success(translation?.lang["Item added to cart"] || "Item added to cart (offline mode)");
        }
      }
    } else {
      // User not authenticated - just use localStorage
      console.log("🔓 [ADD TO CART] User not authenticated, using localStorage only");
      if (isNewItem) {
        toast.success(translation?.lang["Item added to cart"] || "Item added to cart");
      }
    }
    
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ["cart"] }); 
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["carts"] });

    // Send cart event to Neo4j (client-side tracking)
    const sessionId = getSessionId();
    const productIdNum = parseInt(product_id);
    const userId = getUserId();
    
    if (!isNaN(productIdNum)) {
      console.log("🛒 [CART EVENT] Adding product to cart:", {
        product_id: productIdNum,
        session_id: sessionId,
        user_id: userId,
      });
      
      trackEvent({
        event_type: "cart",
        product_id: productIdNum,
        user_session: sessionId,
        user_id: userId ?? undefined,
      });
    }
  };

  return {
    addToCart,
  };
}
