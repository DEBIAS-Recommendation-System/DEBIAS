import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { orderSortFiltersValues } from "../constants/filters";
import { Tables } from "@/types/database.types";

type FilterContextType = {
  sortBy?: orderSortFiltersValues;
  setSortBy?: Dispatch<SetStateAction<keyof Tables<"orders">>>;
  isReversed?: boolean;
  setIsReversed?: Dispatch<SetStateAction<boolean>>;
  filters?: {
    cancelled: boolean;
    pending: boolean;
    approved: boolean;
    fulfilled: boolean;
  };
  setFilters?: Dispatch<
    SetStateAction<{
      cancelled: boolean;
      pending: boolean;
      approved: boolean;
      fulfilled: boolean;
    }>
  >;
};

const FilterContext = createContext<FilterContextType>({});

export function OrderFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sortBy, setSortBy] = useState<orderSortFiltersValues>("created_at");
  const [isReversed, setIsReversed] = useState(false);
  const [filters, setFilters] = useState<{
    cancelled: boolean;
    pending: boolean;
    approved: boolean;
    fulfilled: boolean;
  }>({ cancelled: true, pending: true, approved: true, fulfilled: true });
  return (
    <FilterContext.Provider
      value={{
        sortBy,
        setSortBy,
        isReversed,
        setIsReversed,
        filters,
        setFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useOrderFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error(
      "useOrderFilters must be used within a OrderFilterProvider",
    );
  }
  return {
    sortBy: context.sortBy!,
    setSortBy: context.setSortBy!,
    isReversed: context.isReversed!,
    setIsReversed: context.setIsReversed!,
    filters: context.filters!,
    setFilters: context.setFilters!,
  };
}
