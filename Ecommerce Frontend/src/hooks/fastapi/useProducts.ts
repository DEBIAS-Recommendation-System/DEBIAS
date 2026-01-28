import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { productsApi } from "@/api/fastapi";
import {
  ProductBase,
  ProductCreate,
  ProductUpdate,
  ProductResponse,
  ProductsResponse,
  PaginationParams,
} from "@/types/fastapi";
import { toast } from "sonner";

// Query keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Get all products
export const useProducts = (params?: PaginationParams): UseQueryResult<ProductsResponse, Error> => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getAll(params),
  });
};

// Get product by ID
export const useProduct = (productId: number): UseQueryResult<ProductResponse, Error> => {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });
};

// Create product
export const useCreateProduct = (): UseMutationResult<ProductResponse, Error, ProductCreate> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(data.message || "Product created successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create product";
      toast.error(errorMessage);
    },
  });
};

// Update product
export const useUpdateProduct = (): UseMutationResult<
  ProductResponse,
  Error,
  { productId: number; data: ProductUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }) => productsApi.update(productId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      toast.success(data.message || "Product updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update product";
      toast.error(errorMessage);
    },
  });
};

// Delete product
export const useDeleteProduct = (): UseMutationResult<ProductResponse, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => productsApi.delete(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(data.message || "Product deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete product";
      toast.error(errorMessage);
    },
  });
};
