import { createContext, useContext, useState, ReactNode } from "react";

interface StockPaginationContextProps {
  page: number;
  setPage: (page: number) => void;
}

// Create the context
const StockPaginationContext = createContext<StockPaginationContextProps | undefined>(undefined);

// Provider component
export const StockPaginationProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState<number>(1); // default page is 1

  return (
    <StockPaginationContext.Provider value={{ page, setPage }}>
      {children}
    </StockPaginationContext.Provider>
  );
};

// Custom hook to use the StockPaginationContext
export const useStockPagination = () => {
  const context = useContext(StockPaginationContext);
  if (context === undefined) {
    throw new Error("useStockPagination must be used within a StockPaginationProvider");
  }
  return context;
};
