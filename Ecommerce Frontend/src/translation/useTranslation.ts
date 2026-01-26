"use client";
import { useQuery } from "@tanstack/react-query";
import { translationClientQuery } from "./translationClientQuery";
export default function useTranslation() {
  const query = useQuery(translationClientQuery());
  return query;
}
