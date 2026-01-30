"use client";
import React from "react";
import NotFoundPage from "/public/NotFound/NotFound.png";
import NotFoundPanda from "/public/NotFound/NotFoundPanda.png";
import Image from "next/image";
import Link from "next/link";
import useTranslation from "@/translation/useTranslation";

export const dynamic = 'force-dynamic';

function NotFound() {
  const { data: translation } = useTranslation();
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-start">
      <div className="mt-[2rem] flex h-full w-11/12 flex-col items-center justify-start gap-[5rem]">
        <div className="flex w-full items-center justify-start gap-[1.2rem] border-b border-gray-500 pb-4">
          <div className="flex items-end justify-center gap-[1.2rem]">
          
            <p className="text-4xl font-bold text-slate-700">Page Not Found</p>
            <p className="font-base text-lg text-gray-700">(404 Error)</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-[1.6rem]">
          <Image alt="not found" src={NotFoundPanda} className="" />
          <p className="text-salte-500 text-4xl font-bold">
            Wandered a bit too far, have we?
          </p>
          <p className="font-base text-lg text-gray-700">
            Let's find another way around.
          </p>
          <Link
            className="rounded border border-slate-700 bg-slate-100 p-2 px-5 font-bold text-slate-700 duration-300 ease-in-out hover:!bg-slate-600 hover:!text-slate-200"
            href="/"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
