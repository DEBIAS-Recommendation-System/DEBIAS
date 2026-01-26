import React from "react";
import getProfile from "@/api/getProfile";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await getProfile();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="flex h-full min-h-screen flex-col overflow-x-hidden">

      <main className="h-full min-h-screen w-full">{children}</main>
    </div>
  );
}
