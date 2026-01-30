"use client";
import { cartsApi } from "@/api/fastapi";
import { TokenManager } from "@/api/fastapi/apiClient";

// Interface for cart item from FastAPI backend
export interface ICartItemBackend {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: {
    product_id: number;
    title: string;
    brand: string;
    category: string;
    price: number;
    imgUrl: string;
  };
}

// Interface for the transformed cart item (compatible with UI)
export interface ICartItem {
  id: string;
  product_id: number;
  title: string;
  brand: string;
  category: string;
  category_id: number;
  price: number;
  imgUrl: string | null;
  quantity: number;
  subtotal: number;
  // Additional fields that might be needed by the UI
  discount: number;
  discount_type: string;
  stock: number;
  description: string;
  subtitle: string;
  slug: string | null;
  created_at: string;
  wholesale_price: number;
  extra_images_urls: string[] | null;
}

const cartQuery = () => ({
  queryKey: ["cart"],
  queryFn: async () => {
    const accessToken = TokenManager.getAccessToken();
    console.log("🛒 [CART QUERY] Access token present:", !!accessToken);

    // If user is authenticated, fetch from FastAPI backend
    if (accessToken) {
      try {
        console.log("🛒 [CART QUERY] Fetching carts from FastAPI backend...");
        const cartsResponse = await cartsApi.getAll({ limit: 10 });
        console.log("🛒 [CART QUERY] Carts response:", cartsResponse);

        if (cartsResponse.data && cartsResponse.data.length > 0) {
          // Get the first/active cart
          const activeCart = cartsResponse.data[0];
          console.log("🛒 [CART QUERY] Active cart:", activeCart);
          console.log("🛒 [CART QUERY] Cart items:", activeCart.cart_items);

          // Transform cart_items to match expected UI format
          const cartProducts: ICartItem[] = (activeCart.cart_items || []).map((item: ICartItemBackend) => ({
            // Use product_id as string ID for compatibility
            id: item.product_id.toString(),
            product_id: item.product_id,
            title: item.product?.title || "Unknown Product",
            brand: item.product?.brand || "",
            category: item.product?.category || "",
            category_id: 0, // Not available from backend
            price: item.product?.price || 0,
            imgUrl: item.product?.imgUrl || null,
            quantity: item.quantity,
            subtotal: item.subtotal,
            // Default values for fields not in FastAPI response
            discount: 0,
            discount_type: "FIXED",
            stock: 100, // Assume in stock
            description: "",
            subtitle: "",
            slug: null,
            created_at: new Date().toISOString(),
            wholesale_price: 0,
            extra_images_urls: null,
          }));

          console.log("🛒 [CART QUERY] Transformed cart products:", cartProducts);

          // Also sync to localStorage for UI consistency
          const localStorageCart = cartProducts.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
          }));
          localStorage.setItem("cart", JSON.stringify(localStorageCart));
          console.log("🛒 [CART QUERY] Synced to localStorage:", localStorageCart);

          return {
            data: cartProducts,
            count: cartProducts.length,
            error: null,
            cartId: activeCart.id,
            totalAmount: activeCart.total_amount,
          };
        } else {
          console.log("🛒 [CART QUERY] No carts found for user");
          // Clear localStorage since backend has no cart
          localStorage.setItem("cart", "[]");
          return { data: [], error: null, count: 0 };
        }
      } catch (error) {
        console.error("🛒 [CART QUERY] Error fetching from FastAPI:", error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage for unauthenticated users or if API fails
    console.log("🛒 [CART QUERY] Using localStorage fallback...");
    const cartRaw = localStorage.getItem("cart");
    console.log("🛒 [CART QUERY] Raw localStorage cart:", cartRaw);

    const cart: { product_id: string; quantity: number }[] = JSON.parse(
      cartRaw ?? "[]",
    );
    console.log("🛒 [CART QUERY] Parsed localStorage cart:", cart);

    if (cart.length === 0) {
      console.log("🛒 [CART QUERY] Cart is empty");
      return { data: [], error: null, count: 0 };
    }

    // For localStorage cart, we create minimal product objects
    // The UI will show basic info - for full product details, user should log in
    const cartProducts: ICartItem[] = cart.map((item) => ({
      id: item.product_id,
      product_id: parseInt(item.product_id) || 0,
      title: `Product #${item.product_id}`,
      brand: "",
      category: "",
      category_id: 0,
      price: 0,
      imgUrl: null,
      quantity: item.quantity,
      subtotal: 0,
      discount: 0,
      discount_type: "FIXED",
      stock: 100,
      description: "",
      subtitle: "",
      slug: null,
      created_at: new Date().toISOString(),
      wholesale_price: 0,
      extra_images_urls: null,
    }));

    console.log("🛒 [CART QUERY] localStorage cart products:", cartProducts);

    return {
      data: cartProducts,
      count: cartProducts.length,
      error: null,
    };
  },
});

export { cartQuery };
