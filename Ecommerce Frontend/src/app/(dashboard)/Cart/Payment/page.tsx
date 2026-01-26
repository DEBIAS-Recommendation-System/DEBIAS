
import React from "react";
import Content from "./ui/Content";
import useUser from "@/hooks/data/user/useUser";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Content />
    </div>
  );
}
