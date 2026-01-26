"use client";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery } from "./categoriesQuery";

export default function useCategories() {
  const query = useQuery(categoriesQuery());
  return query;
}
