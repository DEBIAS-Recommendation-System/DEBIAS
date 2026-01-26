import { createContext, useContext, useState, ReactNode } from "react";

interface OrdersPaginationContextProps {
  page: number;
  setPage: (page: number) => void;
}

// Create the context
const OrdersPaginationContext = createContext<OrdersPaginationContextProps | undefined>(undefined);

// Provider component
export const OrdersPaginationProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState<number>(1); // default page is 1

  return (
    <OrdersPaginationContext.Provider value={{ page, setPage }}>
      {children}
    </OrdersPaginationContext.Provider>
  );
};

// Custom hook to use the OrdersPaginationContext
export const useOrdersPagination = () => {
  const context = useContext(OrdersPaginationContext);
  if (context === undefined) {
    throw new Error("useOrdersPagination must be used within a OrdersPaginationProvider");
  }
  return context;
};
