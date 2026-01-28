"use client";

import dynamicImport from "next/dynamic";
import useTranslation from "@/translation/useTranslation";

const Content = dynamicImport(() => import("./ui/Content"), { ssr: false });

export const dynamic = 'force-dynamic';

export default function Page() {
  const { data: translation } = useTranslation();

  return (
    <div
      dir={translation?.default_language === "ar" ? "rtl" : "ltr"}
      className="flex min-h-screen w-full items-start justify-center rounded-md bg-gray-100 py-5"
    >
      <Content />
    </div>
  );
}
