"use client";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Enums } from "@/types/database.types";
import updateData from "@/api/updateData";
import useTranslation from "@/translation/useTranslation";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import useUser from "@/hooks/data/user/useUser";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [languages] = useState([
    { code: "fr", name: "FR", flag: "🇫🇷" },
    { code: "en", name: "EN", flag: "🇬🇧" },
    { code: "ar", name: "AR", flag: "🇹🇳" },
  ] as { code: Enums<"languages_enum">; name: string; flag: string }[]);
  const { data: translation } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { mutate } = useMutation({
    mutationFn: async (newLang: Enums<"languages_enum">) => {
      if (!user?.data) {
        localStorage.setItem("locale", newLang);
        return;
      }
      await updateData({
        tableName: "profiles",
        match: { user_id: user?.data?.user_id },
        payload: { default_language: newLang },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lang"] });
      toast.success(
        translation?.lang["Language changed"] ?? "Language changed",
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex w-[2.5rem] flex-row items-center justify-between gap-0.5 rounded-md border border-slate-400 p-1.5 text-sm">
          <span>
            {
              languages.find(
                (lang) => lang.code === translation?.default_language,
              )?.flag
            }
          </span>
          <ChevronDown className="h-5 w-5" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[4rem] focus:outline-none">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              mutate(lang.code);
            }}
            className="w-full min-w-max cursor-pointer justify-between p-1 text-sm"
          >
            <span className="text-lg">{lang.flag}</span>
            {languages.find(
              (lang) => lang.code === translation?.default_language,
            )?.code === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
