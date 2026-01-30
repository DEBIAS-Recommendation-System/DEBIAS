import Image from "next/image";
import React from "react";
import BreadCrumbs from "./[slug]/ui/BreadCrumbs";
import Content from "./ui/Content";
import SemanticSearchBar from "./ui/SemanticSearchBar";

export const dynamic = 'force-dynamic';

function Page() {
  return (
    <div className="mb-20 flex flex-col">
      <Image
        src={"/product/igracke_header.jpg"}
        alt="logo"
        width={2000}
        height={2000}
        className="w-full"
      />
      <BreadCrumbs />
      
      {/* Semantic Search Bar */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Smart Product Search</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            AI-Powered
          </span>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Search using natural language - our AI understands what you're looking for
        </p>
        <SemanticSearchBar />
      </div>

      <Content />
    </div>
  );
}

export default Page;
