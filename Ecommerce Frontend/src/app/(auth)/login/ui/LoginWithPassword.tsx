"use client";
import login from "@/actions/auth/login";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTranslation from "@/translation/useTranslation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { z } from "zod";

export default function LoginWithPassword() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = React.useState<string>("");
  const { data: translation } = useTranslation();
  const router = useRouter();
  const loginSchema = z.object({
    username: z
      .string({
        message: translation?.lang["{ELEMENT} must be a string"].replace(
          "{ELEMENT}",
          "Username",
        ),
      })
      .min(3, "Username must be at least 3 characters"),
    password: z
      .string({
        message: translation?.lang["{ELEMENT} must be a string"].replace(
          "{ELEMENT}",
          "Password",
        ),
      }),
  });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (formObject: FormData) => {
      const data = Object.fromEntries(formObject) as {
        username: string;
        password: string;
      };

      try {
        loginSchema.parse(data);
        setErrors({});
      } catch (err) {
        setSuccessMessage("");
        if (err instanceof z.ZodError) {
          const errorObj: Record<string, string> = {};
          err.errors.forEach((e) => {
            if (e.path[0]) {
              errorObj[e.path[0] as string] = e.message;
            }
          });
          setErrors(errorObj);
        } else {
          setErrors({
            general: translation?.lang["An unexpected error occurred"] ?? "",
          });
        }
        throw err;
      }

      const username = formObject.get("username") as string;
      const password = formObject.get("password") as string;
      const result = await login({ username, password });

      if (result.error) {
        setErrors({ general: result.error.message });
        throw result.error;
      }
      
      // Store tokens client-side
      if (result.data) {
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('refresh_token', result.data.refresh_token);
        console.log('✅ Login successful - tokens stored');
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate user query to fetch user data with the new token
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccessMessage(translation?.lang["Login successful"] ?? "");
      // Small delay to allow user query to update
      setTimeout(() => {
        router.push("/");
      }, 500);
    },
  });

  return (
    <form className="w-full flex-1 space-y-6" action={mutate}>
      <h2 className="text-2xl font-bold text-gray-800">
        {translation?.lang["Login"]}
      </h2>
      <p className="text-gray-600">
        If you have an account, log in with your username.
      </p>

      <Input
        name="username"
        label="Username"
        type="text"
        required
        error={errors.username}
      />
      <Input
        name="password"
        label={translation?.lang["Password"] ?? "Password"}
        type="password"
        required
        error={errors.password}
      />

      {successMessage && (
        <p className="text-sm text-green-500">{successMessage}</p>
      )}

      {errors.general && (
        <p className="text-sm text-red-500">{errors.general}</p>
      )}

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <PrimaryButton className="max-sm:w-full" loading={isPending}>
          {translation?.lang["Sign In"]}
        </PrimaryButton>
        <Link
          href="/forget_password"
          className="text-sm text-blue-500 hover:underline"
        >
          {translation?.lang["Forgot your password?"]}
        </Link>
      </div>
    </form>
  );
}
