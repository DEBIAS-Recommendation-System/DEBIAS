import React from "react";
import SideBar from "./ui/sideBar";
import getProfile from "@/api/getProfile";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await getProfile();
  if (!user?.is_admin) {
    redirect("/");
  }
  return (
    <div className="flex h-full min-h-screen overflow-x-hidden">
      <SideBar />
      <main className="h-full min-h-screen w-full">{children}</main>
    </div>
  );
}
