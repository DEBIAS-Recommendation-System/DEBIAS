"use client";
import PriceRangeFilter from "./PriceRangeFilter";
// import DiscountFilter from "./DiscountFilter"; // Commented out - products don't have discounts yet
import CategoriesFilter from "./CategoriesFilter";

export function Filters() {
  return (
    <>
      <hr className="!my-4 h-[1px] w-full !bg-gray-500" />
      <PriceRangeFilter />
      <hr className="!my-4 h-[1px] w-full !bg-gray-500" />
      {/* <DiscountFilter /> */} {/* Commented out - products don't have discounts yet */}
      {/* <hr className="!my-4 h-[1px] w-full !bg-gray-500" /> */}
      <CategoriesFilter />
    </>
  );
}
