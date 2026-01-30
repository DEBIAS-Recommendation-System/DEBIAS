"use client";
import React from "react";
import CartItem from "./CartItem";
import dynamic from "next/dynamic";
import { useFilters } from "../context/FiltersProvider";
import useTranslation from "@/translation/useTranslation";
import useCart from "@/hooks/data/cart/useCart";

// Dynamic import to prevent SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function Items() {
  const { filter, isReversed } = useFilters();
  const { data: cart } = useCart();
  const { data: translation } = useTranslation();

  // Debug logging
  console.log("🛒 [CART PAGE - Items] Cart data received:", cart);
  console.log("🛒 [CART PAGE - Items] Cart items:", cart?.data);
  console.log("🛒 [CART PAGE - Items] Cart items count:", cart?.data?.length);

  const sortedCart = cart?.data?.sort((a, b) => {
    if (filter === "price") {
      return (a.price ?? 0) - (b?.price ?? 0);
    }

    if (filter === "discount") {
      return (b.discount ?? 0) - (a.discount ?? 0);
    }
    if (filter === "title") {
      return a.title.localeCompare(b.title ?? "") ?? 0;
    }
    return 0;
  });

  const finalCart = isReversed ? [...(sortedCart ?? [])].reverse() : sortedCart;
  if (cart?.data?.length === 0)
    return (
      <div className="flex h-full w-full max-w-[40rem] items-center justify-center rounded-md bg-white shadow-md">
        <Player
          src={
            "https://lottie.host/85fb7313-2848-45c2-bdb9-2b729f57afc2/AwfmWMtW8n.json"
          }
          className="h-60 w-60"
          loop
          autoplay
        />
      </div>
    );
  return (
    <div className="w-full max-w-[40rem] rounded-md bg-white shadow-md">
      <div className="mx-5 py-4 text-xl text-color1">
        {translation?.lang["you have {QUANTITY} products in your cart"].replace(
          "{QUANTITY}",
          String(cart?.data?.length) ?? 0,
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-5 pb-4">
        {finalCart?.map((item) => <CartItem key={item?.id} product={item} />)}
      </div>
    </div>
  );
}
