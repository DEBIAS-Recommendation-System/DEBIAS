import getSession from "@/api/getSession";
import { redirect } from "next/navigation";
import React from "react";
import ForgotPasswordForm from "./ui/ForgotPasswordForm";

export default async function Page() {
  const { session } = await getSession();
  if (session) redirect("/");
  return (
    <div className="bg-gray-gradient relative box-border flex h-screen w-screen flex-col items-center justify-center overflow-hidden rounded-sm pb-[3px] text-left shadow-[0_8px_14px_3px_#000]">
      <ForgotPasswordForm />
    </div>
  );
}
