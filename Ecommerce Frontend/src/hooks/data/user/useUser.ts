"use client";
import { useQuery } from "@tanstack/react-query";
import { userQuery } from "./userQuery";

export default function useUser() {
  const query = useQuery(userQuery());
  return query;
}
