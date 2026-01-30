import Image from "next/image";
import React from "react";
import RecommendationSection from "./ui/RecommendationSection";
import ProductDetails from "./ui/ProductDetails";
import Policies from "./ui/Policies";
import BreadCrumbs from "./ui/BreadCrumbs";
import ProductByIdHydration from "@/provider/ProductByIdHydration";

export default function Page({
  params,
}: {
  params: {
    slug: string; // This is actually the product ID now
  };
}) {
  return (
    <ProductByIdHydration productId={params.slug}>
      <div className="mb-20 flex flex-col">
        <BreadCrumbs />
        <ProductDetails />
        <Policies />
        <RecommendationSection />
      </div>
    </ProductByIdHydration>
  );
}
