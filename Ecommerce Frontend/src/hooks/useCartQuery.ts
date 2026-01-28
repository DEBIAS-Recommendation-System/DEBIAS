/**
 * React Query Hooks for FastAPI Shopping Cart
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartsApi } from '@/api/fastapi';
import { CartCreate, CartUpdate } from '@/types/fastapi.types';

// Query Keys
export const cartKeys = {
  all: ['carts'] as const,
  lists: () => [...cartKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) => [...cartKeys.lists(), params] as const,
  details: () => [...cartKeys.all, 'detail'] as const,
  detail: (id: number) => [...cartKeys.details(), id] as const,
};

/**
 * Hook to fetch all carts for current user
 */
export function useCarts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: cartKeys.list(params),
    queryFn: () => cartsApi.getAll(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single cart
 */
export function useCart(id: number) {
  return useQuery({
    queryKey: cartKeys.detail(id),
    queryFn: () => cartsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds (carts change frequently)
  });
}

/**
 * Hook to create a new cart
 */
export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cart: CartCreate) => cartsApi.create(cart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}

/**
 * Hook to update a cart
 */
export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CartUpdate }) =>
      cartsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}

/**
 * Hook to delete a cart
 */
export function useDeleteCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}

/**
 * Hook to add item to cart
 * NOTE: These convenience methods (addToCart, removeFromCart, updateCartItemQuantity)
 * are not implemented in the FastAPI backend. Use updateCart instead to modify cart items.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      cartId, 
      productId, 
      quantity 
    }: { 
      cartId: number; 
      productId: number; 
      quantity: number;
    }) => {
      // These helper methods don't exist in the API - use updateCart instead
      throw new Error('Use updateCart to modify cart items');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.cartId) });
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, productId }: { cartId: number; productId: number }) => {
      // These helper methods don't exist in the API - use updateCart instead
      throw new Error('Use updateCart to modify cart items');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.cartId) });
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}

/**
 * Hook to update cart item quantity
 */
export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartId,
      productId,
      quantity,
    }: {
      cartId: number;
      productId: number;
      quantity: number;
    }) => {
      // These helper methods don't exist in the API - use updateCart instead
      throw new Error('Use updateCart to modify cart items');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.cartId) });
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
    },
  });
}
