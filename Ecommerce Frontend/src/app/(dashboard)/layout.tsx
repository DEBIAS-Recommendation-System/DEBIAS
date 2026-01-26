import React, { useTransition } from "react";
import Footer from "./ui/Footer";
import getProfile from "@/api/getProfile";
import { redirect } from "next/navigation";
import { Nav } from "./ui/Nav/Nav";
import getTranslation from "@/translation/getTranslation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await getProfile();
  if (user?.is_admin) {
    redirect("/earnings");
  }
  return (
    <div className="flex h-full min-h-screen flex-col overflow-x-hidden">
      <Nav />
      <main className="h-full min-h-screen w-full">{children}</main>
      <Footer />
    </div>
  );
}
