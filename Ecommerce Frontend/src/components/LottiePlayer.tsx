"use client";
import dynamic from "next/dynamic";

/**
 * Lottie Player component with SSR disabled to prevent 'document is not defined' errors
 * Use this instead of importing Player directly from @lottiefiles/react-lottie-player
 */
export const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
  }
);
