import getSession from "@/api/getSession";
import { redirect } from "next/navigation";
import React from "react";
import ChangePasswordForm from "./ChangePasswordForm/ChangePasswordForm";
export default async function Page() {
  const { session } = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="bg-gray-gradient relative box-border flex h-screen w-screen flex-col items-center justify-center overflow-hidden rounded-sm pb-[3px] text-left shadow-[0_8px_14px_3px_#000]">
      <ChangePasswordForm />
    </div>
  );
}
