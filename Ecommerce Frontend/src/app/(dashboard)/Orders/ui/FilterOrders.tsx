"use client";
import React from "react";
import { useOrderFilters } from "../context/FilterProvider";
import { OrderStatusEnum } from "@/types/database.tables.types";
import useTranslation from "@/translation/useTranslation";

type FilterOption = {
  name: OrderStatusEnum;
  color: string;
};



export default function FilterOrders() {
  const filterOptions: FilterOption[] = [
    { name: OrderStatusEnum.CANCELLED, color: "red-500" },
    { name: OrderStatusEnum.FULFILLED, color: "green-500" },
    { name: OrderStatusEnum.PENDING, color: "yellow-400" },
    { name: OrderStatusEnum.APPROVED, color: "blue-500" },
  ];
  const { filters } = useOrderFilters();

  return (
    <div className="flex flex-row gap-2 max-[760px]:gap-1  max-[410px]:gap-0">
      {filterOptions.map((option) => (
        <FilterElement
          key={option.name}
          name={option.name}
          color={option.color}
          checked={filters[option.name]}
        />
      ))}
    </div>
  );
}

function FilterElement({
  name,
  color,
  checked,
}: {
  name: OrderStatusEnum;
  color: string;
  checked: boolean;
}) {
  const { setFilters } = useOrderFilters();
  const {data: traslation} = useTranslation();


  const handleChange = () => {
    setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex items-center gap-2 rounded-md p-2 dark:bg-black/10 max-[760px]:items-start max-[760px]:gap-1 max-[410px]:p-0.5">
      <label className="flex cursor-pointer items-center">
        <input
          className="sr-only"
          type="checkbox"
          checked={checked}
          onChange={handleChange}
        />
        <div
          className={`size-5 rounded-sm border-2 ${checked ? `bg-${color} border-${color}` : "border-gray-400"} flex items-center justify-center transition-all duration-200 ease-in-out`}
        >
          {checked && (
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
      </label>
      <span
        className={`text-${color} text-lg font-semibold capitalize max-[760px]:text-sm`}
      >
        {traslation?.lang[name] }
      </span>
    </div>
  );
}
