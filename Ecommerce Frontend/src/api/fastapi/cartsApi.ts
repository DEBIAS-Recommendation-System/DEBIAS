import {
  Cart,
  CartCreate,
  CartUpdate,
  ApiResponse,
  ApiListResponse,
} from '@/types/fastapi.types';
import { dummyCarts, delay, cartHelpers, getProductById } from '@/data/dummyData';

export const cartsApi = {
  /**
   * Get all carts for current user
   */
  async getCarts(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiListResponse<Cart>> {
    await delay(300);
    
    return {
      message: 'Carts retrieved successfully',
      data: dummyCarts,
    };
  },

  /**
   * Get single cart by ID
   */
  async getCart(id: number): Promise<ApiResponse<Cart>> {
    await delay(200);
    
    const cart = dummyCarts.find(c => c.id === id);
    if (!cart) {
      throw new Error(`Cart with ID ${id} not found`);
    }
    
    // Use session cart for active cart
    const sessionCart = cartHelpers.getCart();
    const total = cartHelpers.getTotal();
    
    return {
      message: 'Cart retrieved successfully',
      data: {
        ...cart,
        cart_items: sessionCart,
        total_amount: total,
      },
    };
  },

  /**
   * Create new cart
   */
  async createCart(cart: CartCreate): Promise<ApiResponse<Cart>> {
    await delay(400);
    
    // Mock cart creation
    const newCart: Cart = {
      id: dummyCarts.length + 1,
      user_id: 2,
      created_at: new Date().toISOString(),
      total_amount: 0,
      cart_items: [],
    };
    
    console.log('Mock: Cart created', newCart);
    
    return {
      message: 'Cart created successfully',
      data: newCart,
    };
  },

  /**
   * Update existing cart
   */
  async updateCart(id: number, cart: CartUpdate): Promise<ApiResponse<Cart>> {
    await delay(400);
    
    const existingCart = dummyCarts.find(c => c.id === id);
    if (!existingCart) {
      throw new Error(`Cart with ID ${id} not found`);
    }
    
    console.log('Mock: Cart updated', id, cart);
    
    const sessionCart = cartHelpers.getCart();
    const total = cartHelpers.getTotal();
    
    return {
      message: 'Cart updated successfully',
      data: {
        ...existingCart,
        cart_items: sessionCart,
        total_amount: total,
      },
    };
  },

  /**
   * Delete cart
   */
  async deleteCart(id: number): Promise<ApiResponse<Cart>> {
    await delay(400);
    
    const cart = dummyCarts.find(c => c.id === id);
    if (!cart) {
      throw new Error(`Cart with ID ${id} not found`);
    }
    
    cartHelpers.clearCart();
    console.log('Mock: Cart deleted', id);
    
    return {
      message: 'Cart deleted successfully',
      data: cart,
    };
  },

  /**
   * Add item to cart
   */
  async addToCart(cartId: number, productId: number, quantity: number): Promise<ApiResponse<Cart>> {
    await delay(300);
    
    cartHelpers.addToCart(productId, quantity);
    const sessionCart = cartHelpers.getCart();
    const total = cartHelpers.getTotal();
    
    return {
      message: 'Item added to cart successfully',
      data: {
        id: cartId,
        user_id: 2,
        created_at: new Date().toISOString(),
        total_amount: total,
        cart_items: sessionCart,
      },
    };
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(cartId: number, productId: number): Promise<ApiResponse<Cart>> {
    await delay(300);
    
    cartHelpers.removeFromCart(productId);
    const sessionCart = cartHelpers.getCart();
    const total = cartHelpers.getTotal();
    
    return {
      message: 'Item removed from cart successfully',
      data: {
        id: cartId,
        user_id: 2,
        created_at: new Date().toISOString(),
        total_amount: total,
        cart_items: sessionCart,
      },
    };
  },

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(
    cartId: number,
    productId: number,
    quantity: number
  ): Promise<ApiResponse<Cart>> {
    await delay(300);
    
    cartHelpers.updateQuantity(productId, quantity);
    const sessionCart = cartHelpers.getCart();
    const total = cartHelpers.getTotal();
    
    return {
      message: 'Cart item quantity updated successfully',
      data: {
        id: cartId,
        user_id: 2,
        created_at: new Date().toISOString(),
        total_amount: total,
        cart_items: sessionCart,
      },
    };
  },
};
