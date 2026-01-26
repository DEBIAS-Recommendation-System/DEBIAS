"use client";
import React from "react";
import { Player } from "@lottiefiles/react-lottie-player";

export default function Loading() {
  return (
    <div className="m-auto flex min-h-screen items-center justify-center">
      <Player
        className="m-auto"
        autoplay
        loop
        src="/AnimationLoading.json"
        style={{ height: "12rem", width: "12rem" }}
      />
    </div>
  );
}
