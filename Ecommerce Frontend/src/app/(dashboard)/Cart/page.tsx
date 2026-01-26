"use client";
import Content from "./ui/Content";
import useTranslation from "@/translation/useTranslation";

export const dynamic = 'force-dynamic';

export default  function Page() {
  const { data: translation } = useTranslation();
  return (
    <div
      dir={translation?.default_language === "ar" ? "rtl" : "ltr"}
      className="flex h-full flex-col items-center justify-start overflow-y-scroll bg-gray-100"
    >
      <Content />
    </div>
  );
}
