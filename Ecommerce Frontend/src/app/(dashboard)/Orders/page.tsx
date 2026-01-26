"use client";
import useTranslation from "@/translation/useTranslation";
import Content from "./ui/Content";

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
