"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

interface StepContextType {
  step: number;
  setStep: (step: number) => void;
}

const StepContext = createContext<StepContextType | undefined>(undefined);

export const StepProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<number>(1);

  return (
    <StepContext.Provider value={{ step, setStep }}>
      {children}
    </StepContext.Provider>
  );
};

export const useStep = (): StepContextType => {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useStep must be used within a StepProvider');
  }
  return context;
};
