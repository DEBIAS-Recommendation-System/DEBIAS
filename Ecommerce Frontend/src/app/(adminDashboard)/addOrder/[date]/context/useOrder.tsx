"use client";
import React, { createContext, useContext, useState } from "react";
import { Tables } from "@/types/database.types"; // Assuming Tables type is defined here

// Define the shape of the context
type OrderContextType = {
  order: Tables<"orders"> | null;
  setOrder: React.Dispatch<React.SetStateAction<Tables<"orders"> | null>>;
};

// Create the context with an empty default value
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Create a provider component
export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Tables<"orders"> | null>(null);

  return (
    <OrderContext.Provider value={{ order, setOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the OrderContext
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};
