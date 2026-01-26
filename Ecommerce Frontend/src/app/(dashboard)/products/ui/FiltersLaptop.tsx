"use client";
import React from "react";
import { Filters } from "./Filters";
import useTranslation from "@/translation/useTranslation";

function FiltersLaptop() {
  const { data: translation } = useTranslation();
  return (
    <div
      className={`relative top-10 z-50 flex h-full w-[15rem] flex-col gap-3 border-r border-gray-200 !bg-white px-5 py-10 transition-all duration-300 ease-linear max-[830px]:hidden`}
    >
      <span className="w-full min-w-full bg-white text-center text-xl font-bold text-color8">
        {translation?.lang["Choose a filter"]}
      </span>
      <Filters />
    </div>
  );
}

export default FiltersLaptop;
