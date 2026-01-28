import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { categoriesApi } from "@/api/fastapi";
import {
  CategoryBase,
  CategoryCreate,
  CategoryUpdate,
  CategoryResponse,
  CategoriesResponse,
  PaginationParams,
} from "@/types/fastapi";
import { toast } from "sonner";

// Query keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// Get all categories
export const useCategories = (params?: PaginationParams): UseQueryResult<CategoriesResponse, Error> => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesApi.getAll(params),
  });
};

// Get category by ID
export const useCategory = (categoryId: number): UseQueryResult<CategoryResponse, Error> => {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: () => categoriesApi.getById(categoryId),
    enabled: !!categoryId,
  });
};

// Create category
export const useCreateCategory = (): UseMutationResult<CategoryResponse, Error, CategoryCreate> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreate) => categoriesApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(data.message || "Category created successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create category";
      toast.error(errorMessage);
    },
  });
};

// Update category
export const useUpdateCategory = (): UseMutationResult<
  CategoryResponse,
  Error,
  { categoryId: number; data: CategoryUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }) => categoriesApi.update(categoryId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.categoryId) });
      toast.success(data.message || "Category updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update category";
      toast.error(errorMessage);
    },
  });
};

// Delete category
export const useDeleteCategory = (): UseMutationResult<CategoryResponse, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => categoriesApi.delete(categoryId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(data.message || "Category deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete category";
      toast.error(errorMessage);
    },
  });
};
