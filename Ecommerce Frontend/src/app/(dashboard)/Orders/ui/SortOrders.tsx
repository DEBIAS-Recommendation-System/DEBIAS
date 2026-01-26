"use client";
import React from "react";

import { SelectGeneric } from "@/app/ui/SelectGeneric";
import { ToggleSortArrow } from "../../products/ui/ToggleSortArrow";
import {
  OrderSortFilterType,
  orderSortFiltersValues,
} from "../constants/filters";
import { useOrderFilters } from "../context/FilterProvider";
import FilterOrders from "./FilterOrders";
export function SortOrders({ filters }: { filters: OrderSortFilterType[] }) {
  const { setSortBy: setFilter, setIsReversed } = useOrderFilters();
  return (
    <div className="mb-3 flex flex-row items-center gap-4 max-[710px]:flex-col max-[710px]:items-start max-sm:w-full">
      <div className="flex flex-row items-center gap-3">
        {filters.map((filter) => (
          <div className="bg-white" key={filter.title}>
            <SelectGeneric
              className=""
              name="filter"
              inputLabel={filter.title}
              defaultValue={filter.items[0]}
              options={filter.items}
              required={true}
              onChange={(option) => setFilter(option as orderSortFiltersValues)}
            />
          </div>
        ))}
        <div className="rounded-full bg-white">
          <ToggleSortArrow onClick={setIsReversed} />
        </div>
      </div>
      <FilterOrders />
    </div>
  );
}
