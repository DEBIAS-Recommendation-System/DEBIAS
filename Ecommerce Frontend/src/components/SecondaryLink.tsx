import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export default function SecondaryLink({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href: string;
}) {
  return (
    <Link
      onClick={onClick}
      className={cn(
        "rounded-full border-2 border-[#153963] bg-white px-9 py-2 text-center font-semibold text-[#153963] transition-all ease-in-out hover:bg-[#153963] hover:text-white hover:shadow-lg focus:outline-none focus:ring-[#153963]",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
