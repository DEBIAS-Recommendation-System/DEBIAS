"use client";
import React from "react";
import {
  cartSortFilters,
  cartSortFiltersValues,
} from "../constants/CartFilters";
import { SelectGeneric, SelectGenericOption } from "@/app/ui/SelectGeneric";
import { ToggleSortArrow } from "../../products/ui/ToggleSortArrow";
import { useFilters } from "../context/FiltersProvider";
import useTranslation from "@/translation/useTranslation";
export function Filters({ filters }: { filters: typeof cartSortFilters }) {
  const { setFilter, setIsReversed } = useFilters();
  const { data: translation } = useTranslation();
  return (
    <div className="mb-3 flex items-center gap-4">
      {filters.map((filter) => (
        <div className="bg-white" key={filter.title}>
          <SelectGeneric
            className=""
            name="filter"
            inputLabel={filter.title}
            defaultValue={filter.items[0]}
            options={
              filter.items.map((e) => ({
                ...e,
                label: translation?.lang[e.label],
              })) as unknown as SelectGenericOption[]
            }
            required={true}
            onChange={(option) => setFilter(option as cartSortFiltersValues)}
          />
        </div>
      ))}
      <div className="rounded-full bg-white">
        <ToggleSortArrow onClick={setIsReversed} />
      </div>
    </div>
  );
}
