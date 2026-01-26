"use client";
import PriceRangeFilter from "./PriceRangeFilter";
import DiscountFilter from "./DiscountFilter";
import CategoriesFilter from "./CategoriesFilter";

export function Filters() {
  return (
    <>
      <hr className="!my-4 h-[1px] w-full !bg-gray-500" />
      <PriceRangeFilter />
      <hr className="!my-4 h-[1px] w-full !bg-gray-500" />
      <DiscountFilter />
      <hr className="!my-4 h-[1px] w-full !bg-gray-500" />
      <CategoriesFilter />
    </>
  );
}
