"use client";
import React, { useEffect } from "react";
import Footer from "./ui/Footer";
import getProfile from "@/api/getProfile";
import { useRouter } from "next/navigation";
import { Nav } from "./ui/Nav/Nav";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: user } = await getProfile();
      if (user?.is_admin) {
        router.push("/earnings");
      }
    };
    checkAdmin();
  }, [router]);

  return (
    <div className="flex h-full min-h-screen flex-col overflow-x-hidden">
      <Nav />
      <main className="h-full min-h-screen w-full">{children}</main>
      <Footer />
    </div>
  );
}
