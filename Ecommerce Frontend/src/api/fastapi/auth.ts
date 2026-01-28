import apiClient, { TokenManager } from "./apiClient";
import {
  SignupRequest,
  LoginRequest,
  TokenResponse,
  UserResponse,
} from "@/types/fastapi";

export const authApi = {
  // Sign up
  signup: async (data: SignupRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/auth/signup", data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);

    const response = await apiClient.post<TokenResponse>(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Store tokens
    const { access_token, refresh_token, session_id } = response.data;
    TokenManager.setTokens(access_token, refresh_token, session_id);

    return response.data;
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      "/auth/refresh",
      {},
      {
        headers: {
          "refresh-token": refreshToken,
        },
      }
    );

    // Update tokens
    const { access_token, refresh_token, session_id } = response.data;
    TokenManager.setTokens(access_token, refresh_token, session_id);

    return response.data;
  },

  // Logout
  logout: () => {
    TokenManager.clearTokens();
  },
};
