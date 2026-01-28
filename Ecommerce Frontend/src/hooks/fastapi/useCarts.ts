import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { cartsApi } from "@/api/fastapi";
import {
  CartCreate,
  CartUpdate,
  CartResponse,
  CartsResponse,
  PaginationParams,
} from "@/types/fastapi";
import { toast } from "sonner";

// Query keys
export const cartKeys = {
  all: ["carts"] as const,
  lists: () => [...cartKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...cartKeys.lists(), params] as const,
  details: () => [...cartKeys.all, "detail"] as const,
  detail: (id: number) => [...cartKeys.details(), id] as const,
};

// Get all carts
export const useCarts = (params?: PaginationParams): UseQueryResult<CartsResponse, Error> => {
  return useQuery({
    queryKey: cartKeys.list(params),
    queryFn: () => cartsApi.getAll(params),
  });
};

// Get cart by ID
export const useCart = (cartId: number): UseQueryResult<CartResponse, Error> => {
  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: () => cartsApi.getById(cartId),
    enabled: !!cartId,
  });
};

// Create cart
export const useCreateCart = (): UseMutationResult<CartResponse, Error, CartCreate> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CartCreate) => cartsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      toast.success(data.message || "Cart created successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create cart";
      toast.error(errorMessage);
    },
  });
};

// Update cart
export const useUpdateCart = (): UseMutationResult<
  CartResponse,
  Error,
  { cartId: number; data: CartUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, data }) => cartsApi.update(cartId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cartKeys.detail(variables.cartId) });
      toast.success(data.message || "Cart updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update cart";
      toast.error(errorMessage);
    },
  });
};

// Delete cart
export const useDeleteCart = (): UseMutationResult<CartResponse, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartId: number) => cartsApi.delete(cartId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.lists() });
      toast.success(data.message || "Cart deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete cart";
      toast.error(errorMessage);
    },
  });
};
