"use client";
import signOut from "@/actions/auth/signout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function SignOutBtn({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const { mutate } = useMutation({
    mutationFn: async (formData: FormData) => {
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.log('✅ Logged out - tokens cleared');
      await signOut();
    },
    onSuccess: () => {
      // Invalidate all queries to reset app state
      queryClient.clear();
      router.push('/login');
    },
    onError: (error) => {
      alert(error.message);
    },
  });
  return (
    <form action={mutate}>
      <button className="flex flex-row items-center justify-center gap-3">
        {children}
      </button>
    </form>
  );
}
