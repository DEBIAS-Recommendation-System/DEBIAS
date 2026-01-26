import { cn } from "@/lib/utils";
import React from "react";

export default function PrimaryButton({
  children,
  className,
  loading,
}: {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "relative rounded-full border-2 border-[#153963] bg-[#153963] px-9 py-2 font-semibold text-white transition-all ease-in-out hover:bg-white hover:text-[#153963] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#153963] focus:ring-opacity-50",
        className,
      )}
      disabled={loading}
    >
      <div
        className={cn("flex items-center justify-center", {
          invisible: loading, // Hide children when loading
          visible: !loading,
        })}
      >
        {children}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-[#153963]/50 text-white">
          <div className="h-5 w-5 animate-spin rounded-full border-4 border-t-4 border-solid border-white"></div>
        </div>
      )}
    </button>
  );
}
