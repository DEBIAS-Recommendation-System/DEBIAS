"use client";
import React from "react";
import HomeSwiper from "./ui/home/ui/HomeSwiper";
import MomentsSwiper from "./ui/home/ui/MomentsSwiper";
import { ProductsSection } from "./ui/home/ui/ProductsSection/ProductsSection";

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
