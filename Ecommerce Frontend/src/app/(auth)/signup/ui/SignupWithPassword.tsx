"use client";
import signUp from "@/actions/auth/signup";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryLink from "@/components/SecondaryLink";
import useTranslation from "@/translation/useTranslation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { z } from "zod";

export default function SignupWithPassword() {
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();
  const schema = z
    .object({
      full_name: z
        .string({
          message: translation?.lang["{ELEMENT} must be a string"].replace(
            "{ELEMENT}",
            "Full Name",
          ),
        })
        .min(2, "Full name must be at least 2 characters"),
      username: z
        .string({
          message: translation?.lang["{ELEMENT} must be a string"].replace(
            "{ELEMENT}",
            "Username",
          ),
        })
        .min(3, "Username must be at least 3 characters"),
      email: z
        .string({
          message: translation?.lang["{ELEMENT} must be a string"].replace(
            "{ELEMENT}",
            "Email",
          ),
        })
        .email(translation?.lang["Invalid email address"]),
      password: z
        .string({
          message: translation?.lang["{ELEMENT} must be a string"].replace(
            "{ELEMENT}",
            "Password",
          ),
        }),
      confirm: z.string({
        message: translation?.lang["{ELEMENT} must be a string"].replace(
          "{ELEMENT}",
          "Confirm Password",
        ),
      }),
      policies: z
        .boolean({
          message:
            translation?.lang["You must agree to the terms and policies"],
        })
        .refine((val) => val, {
          message:
            translation?.lang["You must agree to the terms and policies"],
        }),
    })
    .refine((data) => data.password === data.confirm, {
      message: translation?.lang["Passwords must match"],
      path: ["confirm"],
    });
  const [fieldErrors, setFieldErrors] = React.useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    policies: "",
  });
  const [successMessage, setSuccessMessage] = React.useState<string>("");

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const formObject = Object.fromEntries(formData) as {
        full_name: string;
        username: string;
        email: string;
        password: string;
        confirm: string;
        policies: string;
      };

      const policies = formObject.policies === "on";

      const data = {
        full_name: formObject.full_name,
        username: formObject.username,
        email: formObject.email,
        password: formObject.password,
        confirm: formObject.confirm,
        policies,
      };

      // Validate data with Zod
      try {
        schema.parse(data);
        setFieldErrors({
          full_name: "",
          username: "",
          email: "",
          password: "",
          confirm: "",
          policies: "",
        });
      } catch (err) {
        setSuccessMessage("");
        if (err instanceof z.ZodError) {
          const errors = {
            full_name: "",
            username: "",
            email: "",
            password: "",
            confirm: "",
            policies: "",
          };

          // Map each error to the corresponding field
          err.errors.forEach((e) => {
            errors[e.path[0] as keyof typeof errors] = e.message;
          });
          setFieldErrors(errors);
        } else {
          setFieldErrors({
            full_name: "",
            username: "",
            email: "",
            password: "",
            confirm: "",
            policies: "An unexpected error occurred",
          });
        }
        throw err;
      }

      // Proceed with signup if validation passes
      const { full_name, username, email, password } = data;
      const { error } = await signUp({ full_name, username, email, password });
      if (error?.message) {
        setFieldErrors({
          ...fieldErrors,
          email: error.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSuccessMessage(translation?.lang["Successfully signed up"] ?? "");
    },
  });

  return (
    <form className="flex-1 space-y-6" action={mutate}>
      <h2 className="text-2xl font-bold text-gray-800">
        {translation?.lang["Create Account"]}
      </h2>

      <Input
        name="full_name"
        label={translation?.lang["Full name"] ?? "Full Name"}
        type="text"
        required
        error={fieldErrors.full_name}
      />
      <Input
        name="username"
        label="Username"
        type="text"
        required
        error={fieldErrors.username}
      />
      <Input
        name="email"
        label="Email"
        type="email"
        required
        error={fieldErrors.email} // Pass email error
      />
      <Input
        name="password"
        label={translation?.lang["Password"] ?? "Password"}
        type="password"
        required
        error={fieldErrors.password} // Pass password error
      />
      <Input
        name="confirm"
        label={translation?.lang["Confirm Password"] ?? "Confirm Password"}
        type="password"
        required
        error={fieldErrors.confirm} // Pass confirm password error
      />

      <div className="flex items-center space-x-4">
        <input name="policies" type="checkbox" id="terms" required />
        <label htmlFor="terms" className="text-sm text-gray-600">
          {translation?.lang["By marking this field, you agree with the"]}{" "}
          <a href="/terms" className="text-blue-500 hover:underline">
            {translation?.lang["terms of use"]}
          </a>{" "}
          {translation?.lang["and"]}{" "}
          <a href="/privacy-policy" className="text-blue-500 hover:underline">
            {translation?.lang["Privacy Policy"]}
          </a>{" "}
          {translation?.lang["of this online store"]}.
        </label>
      </div>
      {fieldErrors.policies && (
        <p className="text-sm text-red-500">{fieldErrors.policies}</p>
      )}

      {successMessage && (
        <p className="text-sm text-green-500">{successMessage}</p>
      )}

      <div className="flex justify-between gap-4 max-sm:flex-col">
        <PrimaryButton className="max-sm:w-full" loading={isPending}>
          {translation?.lang["Sign Up"]}
        </PrimaryButton>
        <SecondaryLink href={"/login"} className="max-sm:w-full">
          {translation?.lang["You have an account?"]}
        </SecondaryLink>
      </div>
    </form>
  );
}
