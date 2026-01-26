/**
 * React Query Hooks for FastAPI Products
 * 
 * These hooks replace the old Supabase-based queries
 * and provide caching, refetching, and error handling via React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/fastapi';
import { Product, ProductSearchParams, DebiasSearchParams } from '@/types/fastapi.types';

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductSearchParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  search: (params: DebiasSearchParams) => [...productKeys.all, 'search', params] as const,
  hubs: () => [...productKeys.all, 'hubs'] as const,
};

/**
 * Hook to fetch all products with pagination
 */
export function useProducts(params?: ProductSearchParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for DEBIAS search
 * This is the main search hook that implements the debiased algorithm
 */
export function useDebiasSearch(params: DebiasSearchParams, enabled: boolean = false) {
  return useQuery({
    queryKey: productKeys.search(params),
    queryFn: () => productsApi.debiasSearch(params),
    enabled: enabled && !!params.query,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for search results)
  });
}

/**
 * Hook to fetch hub products (for cold start / new users)
 */
export function useHubProducts(limit: number = 20) {
  return useQuery({
    queryKey: productKeys.hubs(),
    queryFn: () => productsApi.getHubProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new product (admin only)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to update a product (admin only)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific product and lists
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to delete a product (admin only)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
