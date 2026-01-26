"use client";
import React from "react";
import { useStep } from "../context/useStep";
import { useOrder } from "../context/useOrder";


export default function Navbar() {
  const { step, setStep } = useStep();
  const { order, setOrder } = useOrder();

  return (
    <div className="flex w-full justify-center border-slate-700 bg-slate-100 text-base font-bold text-slate-700">
      <button
        className={`w-[50%] px-4 py-2 text-center ${step == 1 ? "bg-slate-600 text-slate-200" : ""}`}
        onClick={() => setStep(1)}
      >
        User Information
      </button>
      <button
        className={`w-[50%] px-4 py-2 text-center ${step == 2 ? "bg-slate-600 text-slate-200" : ""}`}
        disabled={order ? false : true}
        onClick={() => setStep(2)}
      >
        Order Content
      </button>
    </div>
  );
}
