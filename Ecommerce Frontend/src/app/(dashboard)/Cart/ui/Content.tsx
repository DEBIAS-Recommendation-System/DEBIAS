"use client";

import Items from "./Items";
import Resume from "./Resume";
import { cartSortFilters } from "../constants/CartFilters";
import { Filters } from "./Filters";
import { FiltersProvider } from "../context/FiltersProvider";
import useUser from "@/hooks/data/user/useUser";
import { useRouter } from "next/navigation";

export default function Content() {
  return (
    <FiltersProvider>
      <div className="flex h-full w-full flex-col items-center p-10 transition-all duration-500 max-[480px]:p-4">
        <div className="flex w-full max-w-[63rem] items-center justify-start">
          <Filters filters={cartSortFilters} />
        </div>
        <div className="relative mb-20 flex w-full flex-row justify-center gap-6 max-md:flex-col sm:items-center md:items-start">
          <Items />
          <Resume />
        </div>
      </div>
    </FiltersProvider>
  );
}
