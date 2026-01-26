import { createContext, useContext, useState, ReactNode } from "react";

interface ProductsPaginationContextProps {
  page: number;
  setPage: (page: number) => void;
}

// Create the context
const ProductsPaginationContext = createContext<ProductsPaginationContextProps | undefined>(undefined);

// Provider component
export const ProductsPaginationProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState<number>(1); // default page is 1

  return (
    <ProductsPaginationContext.Provider value={{ page, setPage }}>
      {children}
    </ProductsPaginationContext.Provider>
  );
};

// Custom hook to use the ProductsPaginationContext
export const useProductsPagination = () => {
  const context = useContext(ProductsPaginationContext);
  if (context === undefined) {
    throw new Error("useProductsPagination must be used within a ProductsPaginationProvider");
  }
  return context;
};
