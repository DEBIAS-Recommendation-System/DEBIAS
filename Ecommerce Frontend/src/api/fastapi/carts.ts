import apiClient from "./apiClient";
import {
  CartCreate,
  CartUpdate,
  CartResponse,
  CartsResponse,
  PaginationParams,
} from "@/types/fastapi";

export const cartsApi = {
  // Get all carts (authenticated)
  getAll: async (params?: PaginationParams): Promise<CartsResponse> => {
    const response = await apiClient.get<CartsResponse>("/carts", {
      params,
    });
    return response.data;
  },

  // Get cart by ID (authenticated)
  getById: async (cartId: number): Promise<CartResponse> => {
    const response = await apiClient.get<CartResponse>(`/carts/${cartId}`);
    return response.data;
  },

  // Create cart (authenticated)
  create: async (data: CartCreate): Promise<CartResponse> => {
    const response = await apiClient.post<CartResponse>("/carts", data);
    return response.data;
  },

  // Update cart (authenticated)
  update: async (cartId: number, data: CartUpdate): Promise<CartResponse> => {
    const response = await apiClient.put<CartResponse>(
      `/carts/${cartId}`,
      data
    );
    return response.data;
  },

  // Delete cart (authenticated)
  delete: async (cartId: number): Promise<CartResponse> => {
    const response = await apiClient.delete<CartResponse>(`/carts/${cartId}`);
    return response.data;
  },
};
