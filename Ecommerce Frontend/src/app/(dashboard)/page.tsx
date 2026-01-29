"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ProductsSection } from "./ui/home/ui/ProductsSection/ProductsSection";

const HomeSwiper = dynamic(() => import("./ui/home/ui/HomeSwiper"), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse bg-gray-200" />,
});

const MomentsSwiper = dynamic(() => import("./ui/home/ui/MomentsSwiper"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-gray-200" />,
});

export default function Page() {
  return (
    <div className="flex min-h-screen w-screen flex-col overflow-x-hidden">
      <hr />
      <HomeSwiper />
      <MomentsSwiper />
      {/*<OffersContainer />*/}
      <ProductsSection />
    </div>
  );
}
