import { cn } from "@/lib/utils";
import React from "react";

export default function SecondaryButton({
  children,
  className,
  onClick,
  type = "button", // Added type with default value
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset"; // Added type prop to support different button types
}) {
  return (
    <button
      type={type} // Set button type
      onClick={onClick}
      className={cn(
        "rounded-full border-2 border-[#153963] bg-white px-9 py-2 font-semibold text-[#153963] transition-all ease-in-out hover:bg-[#153963] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#153963] focus:ring-opacity-50", // Enhanced focus ring
        className,
      )}
    >
      {children}
    </button>
  );
}
