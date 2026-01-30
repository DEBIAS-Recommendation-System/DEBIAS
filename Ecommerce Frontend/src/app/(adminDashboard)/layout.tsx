"use client";
import React, { useEffect } from "react";
import SideBar from "./ui/sideBar";
import getProfile from "@/api/getProfile";
import { useRouter } from "next/navigation";
import Loading from "./loading";

export const dynamic = "force-dynamic";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await getProfile();
      if (!userData?.is_admin) {
        router.push("/");
      } else {
        setUser(userData);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="flex h-full min-h-screen overflow-x-hidden">
      <SideBar />
      <main className="h-full min-h-screen w-full">{children}</main>
    </div>
  );
}
