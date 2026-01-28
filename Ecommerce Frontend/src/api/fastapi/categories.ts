import apiClient from "./apiClient";
import {
  CategoryCreate,
  CategoryUpdate,
  CategoryResponse,
  CategoriesResponse,
  PaginationParams,
} from "@/types/fastapi";

export const categoriesApi = {
  // Get all categories
  getAll: async (params?: PaginationParams): Promise<CategoriesResponse> => {
    const response = await apiClient.get<CategoriesResponse>("/categories", {
      params,
    });
    return response.data;
  },

  // Get category by ID
  getById: async (categoryId: number): Promise<CategoryResponse> => {
    const response = await apiClient.get<CategoryResponse>(
      `/categories/${categoryId}`
    );
    return response.data;
  },

  // Create category (admin only)
  create: async (data: CategoryCreate): Promise<CategoryResponse> => {
    const response = await apiClient.post<CategoryResponse>(
      "/categories",
      data
    );
    return response.data;
  },

  // Update category (admin only)
  update: async (
    categoryId: number,
    data: CategoryUpdate
  ): Promise<CategoryResponse> => {
    const response = await apiClient.put<CategoryResponse>(
      `/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  // Delete category (admin only)
  delete: async (categoryId: number): Promise<CategoryResponse> => {
    const response = await apiClient.delete<CategoryResponse>(
      `/categories/${categoryId}`
    );
    return response.data;
  },
};
