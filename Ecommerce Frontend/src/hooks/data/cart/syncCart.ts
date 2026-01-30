"use client";
import { cartsApi } from "@/api/fastapi";
import { TokenManager } from "@/api/fastapi/apiClient";

interface LocalCartItem {
  product_id: string;
  quantity: number;
}

/**
 * Syncs the backend cart with localStorage
 * This should be called after login to merge backend cart with local cart
 */
export async function syncCartFromBackend(): Promise<boolean> {
  const accessToken = TokenManager.getAccessToken();
  
  if (!accessToken) {
    console.log("🔓 [SYNC CART] No access token, skipping sync");
    return false;
  }

  try {
    console.log("📡 [SYNC CART] Fetching user carts from backend...");
    const cartsResponse = await cartsApi.getAll({ limit: 10 });
    
    if (!cartsResponse.data || cartsResponse.data.length === 0) {
      console.log("📭 [SYNC CART] No backend cart found");
      return true;
    }

    // Get the first (active) cart
    const backendCart = cartsResponse.data[0];
    console.log("📦 [SYNC CART] Found backend cart:", backendCart.id, "with", backendCart.cart_items?.length || 0, "items");

    // Get current localStorage cart
    const localCart: LocalCartItem[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    
    // Merge backend cart items with local cart
    const mergedCart: LocalCartItem[] = [...localCart];
    
    for (const backendItem of backendCart.cart_items || []) {
      const localIndex = mergedCart.findIndex(
        item => item.product_id === backendItem.product_id.toString()
      );
      
      if (localIndex >= 0) {
        // Item exists locally - use the higher quantity
        mergedCart[localIndex].quantity = Math.max(
          mergedCart[localIndex].quantity,
          backendItem.quantity
        );
      } else {
        // Item doesn't exist locally - add it
        mergedCart.push({
          product_id: backendItem.product_id.toString(),
          quantity: backendItem.quantity,
        });
      }
    }

    // Save merged cart to localStorage
    localStorage.setItem("cart", JSON.stringify(mergedCart));
    console.log("✅ [SYNC CART] Cart synced successfully:", mergedCart);
    
    return true;
  } catch (error) {
    console.error("❌ [SYNC CART] Failed to sync cart from backend:", error);
    return false;
  }
}

/**
 * Syncs localStorage cart to the backend
 * Creates a new cart if none exists, or updates the existing one
 */
export async function syncCartToBackend(): Promise<boolean> {
  const accessToken = TokenManager.getAccessToken();
  
  if (!accessToken) {
    console.log("🔓 [SYNC CART] No access token, skipping sync");
    return false;
  }

  try {
    // Get current localStorage cart
    const localCart: LocalCartItem[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    
    if (localCart.length === 0) {
      console.log("📭 [SYNC CART] Local cart is empty, nothing to sync");
      return true;
    }

    // Convert to backend format
    const cartItems = localCart
      .map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity,
      }))
      .filter(item => !isNaN(item.product_id)); // Filter out invalid IDs

    if (cartItems.length === 0) {
      console.log("⚠️ [SYNC CART] No valid cart items to sync");
      return true;
    }

    console.log("📡 [SYNC CART] Checking for existing backend cart...");
    const cartsResponse = await cartsApi.getAll({ limit: 1 });

    if (cartsResponse.data && cartsResponse.data.length > 0) {
      // Update existing cart
      const existingCart = cartsResponse.data[0];
      console.log("📝 [SYNC CART] Updating existing cart:", existingCart.id);
      await cartsApi.update(existingCart.id, { cart_items: cartItems });
      console.log("✅ [SYNC CART] Cart updated successfully");
    } else {
      // Create new cart
      console.log("🆕 [SYNC CART] Creating new cart with", cartItems.length, "items");
      await cartsApi.create({ cart_items: cartItems });
      console.log("✅ [SYNC CART] New cart created successfully");
    }

    return true;
  } catch (error) {
    console.error("❌ [SYNC CART] Failed to sync cart to backend:", error);
    return false;
  }
}

/**
 * Clear the local cart
 */
export function clearLocalCart(): void {
  localStorage.removeItem("cart");
  console.log("🗑️ [SYNC CART] Local cart cleared");
}
