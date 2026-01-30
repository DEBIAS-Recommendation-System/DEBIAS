import apiClient, { TokenManager } from "./apiClient";
import {
  SignupRequest,
  LoginRequest,
  TokenResponse,
  UserResponse,
  AccountResponse,
} from "@/types/fastapi";
import { syncCartFromBackend, syncCartToBackend } from "@/hooks/data/cart/syncCart";

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

    // Fetch user info to get user_id for event tracking
    try {
      const meResponse = await apiClient.get<AccountResponse>("/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (meResponse.data?.data?.id) {
        // Store user_id for event tracking
        if (typeof window !== "undefined") {
          localStorage.setItem("user_id", meResponse.data.data.id.toString());
        }
        console.log("✅ [AUTH] User ID stored for event tracking:", meResponse.data.data.id);
      }
    } catch (err) {
      console.warn("⚠️ [AUTH] Could not fetch user info after login:", err);
    }

    // Sync cart after login: first sync local cart to backend, then merge backend cart
    try {
      console.log("🛒 [AUTH] Syncing cart after login...");
      // First, push local cart items to backend (in case user added items while logged out)
      await syncCartToBackend();
      // Then, sync any backend cart items back to localStorage (merges both)
      await syncCartFromBackend();
      console.log("✅ [AUTH] Cart sync completed");
    } catch (err) {
      console.warn("⚠️ [AUTH] Cart sync failed after login:", err);
    }

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
    // Also clear user_id
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_id");
    }
  },
};
