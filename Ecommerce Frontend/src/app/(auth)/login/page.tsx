import getSession from "@/api/getSession";
import LoginForm from "@/app/(auth)/login/ui/LoginForm";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page() {
  const { session } = await getSession();
  if (session) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="z-10 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
