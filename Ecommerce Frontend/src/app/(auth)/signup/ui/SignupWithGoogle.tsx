"use client";
import signInWithOAuth from "@/actions/auth/signInWithOAuth";
import FcGoogle from "@/components/icons/FcGoogle";
import useTranslation from "@/translation/useTranslation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";

export default function SignupWithGoogle() {
  const router = useRouter();
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async () => {
      const { data, error } = await signInWithOAuth({ provider: "google" });
      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      if (data?.url) {
        router.push(data.url);
      }
    },
  });
  return (
    <button
      className={
        "flex w-64 cursor-pointer items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 ease-in-out hover:border-gray-400 hover:bg-gray-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 max-sm:w-full"
      }
      onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        mutate();
      }}
    >
      <FcGoogle size={20} />
      <span className="text-sm">
        {translation?.lang["Sign Up with Google"]}
      </span>
    </button>
  );
}
