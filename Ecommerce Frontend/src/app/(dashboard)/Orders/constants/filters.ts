import { SelectGenericOption } from "@/app/ui/SelectGeneric";
import { Tables } from "@/types/database.types";

interface OrderFilterOption extends SelectGenericOption {
  value: keyof Tables<"orders">;
}

export type OrderSortFilterType = {
  title: string;
  items: OrderFilterOption[];
};

export const orderSortFilters: OrderSortFilterType[] = [
  {
    title: "Sort",
    items: [
      { label: "By Date", value: "created_at" },
      { label: "By status", value: "status" },
      { label: "By Price", value: "total_price" },
    ],
  },
];

export type orderSortFiltersValues =
  (typeof orderSortFilters)[number]["items"][number]["value"];
