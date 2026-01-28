import apiClient from "./apiClient";
import {
  UserCreate,
  UserUpdate,
  UserResponse,
  UsersResponse,
  UserQueryParams,
} from "@/types/fastapi";

export const usersApi = {
  // Get all users (admin only)
  getAll: async (params?: UserQueryParams): Promise<UsersResponse> => {
    const response = await apiClient.get<UsersResponse>("/users", {
      params,
    });
    return response.data;
  },

  // Get user by ID (admin only)
  getById: async (userId: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  // Create user (admin only)
  create: async (data: UserCreate): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/users", data);
    return response.data;
  },

  // Update user (admin only)
  update: async (userId: number, data: UserUpdate): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(
      `/users/${userId}`,
      data
    );
    return response.data;
  },

  // Delete user (admin only)
  delete: async (userId: number): Promise<UserResponse> => {
    const response = await apiClient.delete<UserResponse>(`/users/${userId}`);
    return response.data;
  },
};
