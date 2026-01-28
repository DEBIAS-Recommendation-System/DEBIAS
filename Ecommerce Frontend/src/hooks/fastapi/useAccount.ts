import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { accountApi } from "@/api/fastapi";
import { AccountUpdate, AccountResponse } from "@/types/fastapi";
import { toast } from "sonner";

// Query keys
export const accountKeys = {
  all: ["account"] as const,
  me: () => [...accountKeys.all, "me"] as const,
};

// Get my account info
export const useMyAccount = (): UseQueryResult<AccountResponse, Error> => {
  return useQuery({
    queryKey: accountKeys.me(),
    queryFn: () => accountApi.getMyInfo(),
  });
};

// Update my account
export const useUpdateMyAccount = (): UseMutationResult<AccountResponse, Error, AccountUpdate> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountUpdate) => accountApi.updateMyInfo(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.me() });
      toast.success(data.message || "Account updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update account";
      toast.error(errorMessage);
    },
  });
};

// Delete my account
export const useDeleteMyAccount = (): UseMutationResult<AccountResponse, Error, void> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountApi.deleteMyAccount(),
    onSuccess: (data) => {
      queryClient.clear();
      toast.success(data.message || "Account deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete account";
      toast.error(errorMessage);
    },
  });
};
