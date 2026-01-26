"use client";
import Image from "next/image";
import Link from "next/link";
import SecondaryButton from "../../../../components/SecondaryButton";
import LoginWithPassword from "./LoginWithPassword";
import LoginWithGoogle from "./LoginWithGoogle";
import useTranslation from "@/translation/useTranslation";

export default function LoginForm() {
  const { data: translation } = useTranslation();
  return (
    <div className="mx-auto flex h-fit w-full max-w-[75rem] flex-col rounded-lg border bg-white p-10 shadow-lg">
      <div className="relative mb-8 h-64 w-full max-lg:h-28 max-sm:hidden">
        <Image
          src="/bgBanner.svg"
          alt="Login Banner"
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-black bg-opacity-25">
          <h1 className="text-3xl font-bold text-white text-shadow max-sm:text-2xl">
            {translation?.lang["Join Us and Explore!"]}
          </h1>
        </div>
      </div>
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1">
          <LoginWithPassword />
          <div className="mt-6 flex w-full flex-col items-center justify-center gap-6">
            <div className="mx-auto flex w-full items-center justify-center space-x-3">
              <hr className="w-36 border-gray-300 max-sm:flex-1" />
              <span className="text-sm text-gray-500">
                {translation?.lang["or login with"]}
              </span>
              <hr className="w-36 border-gray-300 max-sm:flex-1" />
            </div>
            <LoginWithGoogle />
          </div>
        </div>
        <div className="hidden lg:block lg:w-px lg:bg-gray-200" />
        <div className="flex-1 space-y-4 text-center lg:w-1/2 lg:text-left">
          <h2 className="text-2xl font-semibold text-gray-800">
            {translation?.lang["New Users"]}
          </h2>
          <p className="text-gray-600">
            {
              translation?.lang[
                "Create an account to shop faster, manage multiple addresses, and much more."
              ]
            }
          </p>
          <div>
            <Link href="/signup">
              <SecondaryButton className="">
                {translation?.lang["Create an account"]}
              </SecondaryButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
