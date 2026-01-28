import apiClient from "./apiClient";
import { AccountUpdate, AccountResponse } from "@/types/fastapi";

export const accountApi = {
  // Get my account info (authenticated)
  getMyInfo: async (): Promise<AccountResponse> => {
    const response = await apiClient.get<AccountResponse>("/me");
    return response.data;
  },

  // Update my account info (authenticated)
  updateMyInfo: async (data: AccountUpdate): Promise<AccountResponse> => {
    const response = await apiClient.put<AccountResponse>("/me", data);
    return response.data;
  },

  // Delete my account (authenticated)
  deleteMyAccount: async (): Promise<AccountResponse> => {
    const response = await apiClient.delete<AccountResponse>("/me");
    return response.data;
  },
};
