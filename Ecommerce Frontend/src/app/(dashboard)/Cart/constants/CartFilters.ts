import { SelectGenericOption } from "@/app/ui/SelectGeneric";
import { Tables } from "@/types/database.types";

interface CartFilterOption extends SelectGenericOption {
  value: keyof Tables<"products">;
}

export const cartSortFilters = [
  {
    title: "Sort",
    items: [
      { label: "Alphabetically", value: "title" },
      { label: "By price", value: "price" },
      { label: "By Discount", value: "discount" },
    ],
  },
] as const;

export type cartSortFiltersValues =
  (typeof cartSortFilters)[number]["items"][number]["value"];
