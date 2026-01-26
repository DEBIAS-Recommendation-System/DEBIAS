"use client";
import React from "react";
import SignupWithPassword from "./SignupWithPassword";
import SignupWithGoogle from "./SignupWithGoogle";
import useTranslation from "@/translation/useTranslation";

export default function SignupForm() {
  const { data: translation } = useTranslation();
  return (
    <div className="mx-auto flex h-fit w-full max-w-[40rem] flex-col gap-3 rounded-lg border p-10 shadow-lg">
      <SignupWithPassword />
      <div className="mt-6 flex w-full flex-col items-center justify-center gap-6">
        <div className="mx-auto flex w-full items-center justify-center space-x-3">
          <hr className="w-36 border-gray-300 max-sm:flex-1" />
          <span className="text-sm text-gray-500">
            {translation?.lang["or sign up with"]}
          </span>
          <hr className="w-36 border-gray-300 max-sm:flex-1" />
        </div>
        <SignupWithGoogle />
      </div>
    </div>
  );
}
