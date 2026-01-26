"use client";
import updatePassword from "@/actions/auth/updatePassword";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import useTranslation from "@/translation/useTranslation";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { z } from "zod";

export default function ChangePasswordForm() {
  const { data: translation } = useTranslation();
  const [fieldErrors, setFieldErrors] = React.useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = React.useState<string>("");
  const changePasswordSchema = z
    .object({
      newPassword: z
        .string({
          message: translation?.lang["{ELEMENT} must be a string"].replace(
            "{ELEMENT}",
            "New password",
          ),
        })
        .min(6, translation?.lang["Password must be at least 6 characters"]),
      confirmPassword: z.string({
        message: translation?.lang["{ELEMENT} must be a string"].replace(
          "{ELEMENT}",
          "Confirm password",
        ),
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: translation?.lang["Passwords must match"],
      path: ["confirmPassword"], // path to show error for confirmPassword
    });
  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      const formObject = Object.fromEntries(formData) as {
        newPassword: string;
        confirmPassword: string;
      };

      // Validate form data using Zod schema
      try {
        changePasswordSchema.parse(formObject);
        // Clear errors if validation passes
        setFieldErrors({
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errors = {
            newPassword: "",
            confirmPassword: "",
          };

          err.errors.forEach((e) => {
            errors[e.path[0] as keyof typeof errors] = e.message;
          });
          setFieldErrors(errors);
        } else {
          setFieldErrors({
            newPassword: "",
            confirmPassword:
              translation?.lang["An unexpected error occurred"] ?? "",
          });
        }
        throw err; // Stop further processing
      }

      // Update password logic here
      const { error } = await updatePassword({
        newPassword: formObject.newPassword,
      });

      if (error) {
        setFieldErrors({
          ...fieldErrors,
          newPassword: error.message,
        });
        throw new Error(error.message);
      }

      // Set success message
      setSuccessMessage(
        translation?.lang["Your password has been successfully changed."] ?? "",
      );
    },
  });

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">
        {translation?.lang["Change Password"]}
      </h2>
      <form action={mutate} className="space-y-6">
        <Input
          label={translation?.lang["New Password"] ?? "New Password"}
          type="password"
          required
          name="newPassword"
          error={fieldErrors.newPassword} // Pass error to the Input component
        />
        <Input
          label={translation?.lang["Confirm Password"] ?? "Confirm Password"}
          type="password"
          required
          name="confirmPassword"
          error={fieldErrors.confirmPassword} // Pass error to the Input component
        />

        {successMessage && (
          <p className="text-sm text-green-500">{successMessage}</p>
        )}

        <PrimaryButton loading={isPending} className="w-full">
          {translation?.lang["Change Password"]}
        </PrimaryButton>
      </form>
    </div>
  );
}
