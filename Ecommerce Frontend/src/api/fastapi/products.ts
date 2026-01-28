import apiClient from "./apiClient";
import {
  ProductBase,
  ProductCreate,
  ProductUpdate,
  ProductResponse,
  ProductsResponse,
  PaginationParams,
} from "@/types/fastapi";

export const productsApi = {
  // Get all products
  getAll: async (params?: PaginationParams): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>("/products", {
      params,
    });
    return response.data;
  },

  // Get product by ID
  getById: async (productId: number): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(
      `/products/${productId}`
    );
    return response.data;
  },

  // Create product (admin only)
  create: async (data: ProductCreate): Promise<ProductResponse> => {
    const response = await apiClient.post<ProductResponse>("/products", data);
    return response.data;
  },

  // Update product (admin only)
  update: async (
    productId: number,
    data: ProductUpdate
  ): Promise<ProductResponse> => {
    const response = await apiClient.put<ProductResponse>(
      `/products/${productId}`,
      data
    );
    return response.data;
  },

  // Delete product (admin only)
  delete: async (productId: number): Promise<ProductResponse> => {
    const response = await apiClient.delete<ProductResponse>(
      `/products/${productId}`
    );
    return response.data;
  },
};
