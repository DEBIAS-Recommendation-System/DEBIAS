import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { usersApi } from "@/api/fastapi";
import {
  UserCreate,
  UserUpdate,
  UserResponse,
  UsersResponse,
  UserQueryParams,
} from "@/types/fastapi";
import { toast } from "sonner";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: UserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Get all users (admin only)
export const useUsers = (params?: UserQueryParams): UseQueryResult<UsersResponse, Error> => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getAll(params),
  });
};

// Get user by ID (admin only)
export const useUser = (userId: number): UseQueryResult<UserResponse, Error> => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersApi.getById(userId),
    enabled: !!userId,
  });
};

// Create user (admin only)
export const useCreateUser = (): UseMutationResult<UserResponse, Error, UserCreate> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(data.message || "User created successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create user";
      toast.error(errorMessage);
    },
  });
};

// Update user (admin only)
export const useUpdateUser = (): UseMutationResult<
  UserResponse,
  Error,
  { userId: number; data: UserUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) => usersApi.update(userId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
      toast.success(data.message || "User updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update user";
      toast.error(errorMessage);
    },
  });
};

// Delete user (admin only)
export const useDeleteUser = (): UseMutationResult<UserResponse, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(data.message || "User deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete user";
      toast.error(errorMessage);
    },
  });
};
