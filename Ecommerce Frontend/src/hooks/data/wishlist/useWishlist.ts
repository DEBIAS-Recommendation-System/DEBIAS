"use client";
import { useQuery } from "@tanstack/react-query";
import { wishlistQuery } from "./wishlistQuery";

export default function useWishlist() {
  const query = useQuery(wishlistQuery());
  return query;
}