import React from "react";

import HomeHydration from "@/provider/HomeHydration";
import HomeSwiper from "./ui/home/ui/HomeSwiper";
import MomentsSwiper from "./ui/home/ui/MomentsSwiper";
import { ProductsSection } from "./ui/home/ui/ProductsSection/ProductsSection";

// Force dynamic rendering to avoid SSR/build issues
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <HomeHydration>
      <div className="flex min-h-screen w-screen flex-col overflow-x-hidden">
        <hr />
        <HomeSwiper />
        <MomentsSwiper />
        {/*<OffersContainer />*/}
        <ProductsSection />
      </div>
    </HomeHydration>
  );
}
