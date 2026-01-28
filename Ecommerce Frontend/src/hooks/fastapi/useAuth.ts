import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { authApi } from "@/api/fastapi";
import { SignupRequest, LoginRequest, TokenResponse, UserResponse } from "@/types/fastapi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Sign up hook
export const useSignup = (): UseMutationResult<UserResponse, Error, SignupRequest> => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: (data) => {
      toast.success(data.message || "Account created successfully!");
      router.push("/login");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create account";
      toast.error(errorMessage);
    },
  });
};

// Login hook
export const useLogin = (): UseMutationResult<TokenResponse, Error, LoginRequest> => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: () => {
      toast.success("Logged in successfully!");
      router.push("/");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Invalid credentials";
      toast.error(errorMessage);
    },
  });
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();

  const logout = () => {
    authApi.logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return { logout };
};
