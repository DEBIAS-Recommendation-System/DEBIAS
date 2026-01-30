"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyInfo, updateMyInfo, deleteMyAccount } from "@/actions/account/account";
import PrimaryButton from "@/components/PrimaryButton";
import useTranslation from "@/translation/useTranslation";
import { z } from "zod";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { data: translation } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: "",
    username: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState({
    full_name: "",
    username: "",
    email: "",
  });
  const [successMessage, setSuccessMessage] = React.useState("");

  // Fetch user info
  const { data: userInfo, isLoading, error } = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const result = await getMyInfo();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data?.data;
    },
  });

  // Update form data when user info loads
  React.useEffect(() => {
    if (userInfo) {
      setFormData({
        full_name: userInfo.full_name || "",
        username: userInfo.username || "",
        email: userInfo.email || "",
      });
    }
  }, [userInfo]);

  const schema = z.object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .email("Invalid email address"),
  });

  // Update user info mutation
  const updateMutation = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate data with Zod
      try {
        schema.parse(formData);
        setFieldErrors({
          full_name: "",
          username: "",
          email: "",
        });
      } catch (err) {
        setSuccessMessage("");
        if (err instanceof z.ZodError) {
          const errors = {
            full_name: "",
            username: "",
            email: "",
          };
          err.errors.forEach((e) => {
            errors[e.path[0] as keyof typeof errors] = e.message;
          });
          setFieldErrors(errors);
        }
        throw err;
      }

      const result = await updateMyInfo(formData);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      setSuccessMessage("Successfully updated");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      setFieldErrors({
        ...fieldErrors,
        email: error.message,
      });
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteMyAccount();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      router.push("/");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load account information</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            {translation?.lang["Account"] ?? "My Account"}
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Edit
            </button>
          )}
        </div>

        {successMessage && (
          <p className="mb-4 text-sm text-green-500">{successMessage}</p>
        )}

        <form className="space-y-6" onSubmit={updateMutation.mutate}>
          <div className="flex w-full flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              {translation?.lang["Full name"] ?? "Full Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditing}
              placeholder={translation?.lang["Full name"] ?? "Full Name"}
              className="h-11 w-full rounded-md border border-gray-300 px-4 text-gray-800 outline-none disabled:bg-gray-100"
            />
            {fieldErrors.full_name && (
              <p className="text-sm text-red-500">{fieldErrors.full_name}</p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!isEditing}
              placeholder="Username"
              className="h-11 w-full rounded-md border border-gray-300 px-4 text-gray-800 outline-none disabled:bg-gray-100"
            />
            {fieldErrors.username && (
              <p className="text-sm text-red-500">{fieldErrors.username}</p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              placeholder="Email"
              className="h-11 w-full rounded-md border border-gray-300 px-4 text-gray-800 outline-none disabled:bg-gray-100"
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>Role:</strong> {userInfo?.role}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <strong>Member since:</strong>{" "}
              {new Date(userInfo?.created_at).toLocaleDateString()}
            </p>
          </div>

          {isEditing && (
            <div className="flex gap-4">
              <PrimaryButton
                className="flex-1"
                loading={updateMutation.isPending}
              >
                Save Changes
              </PrimaryButton>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (userInfo) {
                    setFormData({
                      full_name: userInfo.full_name || "",
                      username: userInfo.username || "",
                      email: userInfo.email || "",
                    });
                  }
                  setFieldErrors({ full_name: "", username: "", email: "" });
                  setSuccessMessage("");
                }}
                className="flex-1 rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                disabled={updateMutation.isPending}
              >
                {translation?.lang["Cancel"] ?? "Cancel"}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-xl font-semibold text-red-600">
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? "Deleting..."
              : (translation?.lang["Delete"] ?? "Delete Account")}
          </button>
        </div>
      </div>
    </div>
  );
}
