import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export default function PrimaryLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border-2 border-[#153963] bg-[#153963] px-9 py-2 font-semibold text-white transition-all hover:bg-white hover:text-[#153963]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
