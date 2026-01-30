"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Quantum } from 'ldrs/react'
import 'ldrs/react/Quantum.css'

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function Loading() {
  return (
    <div className="m-auto flex min-h-screen items-center justify-center">
<Quantum
  size="55"
  speed="1"
  color="orange" 
/>
    </div>
  );
}