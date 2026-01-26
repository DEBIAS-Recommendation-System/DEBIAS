import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { cartSortFiltersValues } from "../constants/CartFilters";

type FiltersType = Partial<{
  isReversed: boolean;
  filter: cartSortFiltersValues;
  setIsReversed: Dispatch<SetStateAction<boolean>>;
  setFilter: Dispatch<SetStateAction<cartSortFiltersValues>>;
}>;

const FiltersContext = createContext<FiltersType>({});

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [filter, setFilter] = useState<cartSortFiltersValues>("title");

  return (
    <FiltersContext.Provider
      value={{ isReversed, setIsReversed, filter, setFilter }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context || context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return {
    isReversed: context.isReversed!,
    setIsReversed: context.setIsReversed!,
    filter: context.filter!,
    setFilter: context.setFilter!,
  };
}
