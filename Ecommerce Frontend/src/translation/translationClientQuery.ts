"use client";
import { ILanguages } from "@/types/database.tables.types";
import getTranslation from "./getTranslation";
import locale from "antd/es/date-picker/locale/en_US";

export const translationClientQuery = () => {
  let locale = "fr";
  try {
    locale = localStorage.getItem("locale") ?? "";
  } catch (error) {
    console.error("Error getting locale from localStorage", error);
  }
  if (!["en", "fr", "ar"].includes(locale)) {
    locale = "fr";
  }
  return {
    queryKey: ["lang", locale],
    queryFn: async () => {
      console.log("🚀 ~ translationClientQuery ~ locale:", locale);
      const langRes = await getTranslation(locale as ILanguages);
      return langRes;
    },
  };
};
