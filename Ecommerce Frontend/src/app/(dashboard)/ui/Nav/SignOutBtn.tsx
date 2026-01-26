"use client";
import signOut from "@/actions/auth/signout";
import { useMutation } from "@tanstack/react-query";

export default function SignOutBtn({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mutate } = useMutation({
    mutationFn: async (formData: FormData) => {
      await signOut();
    },
    onSuccess: () => {},
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
