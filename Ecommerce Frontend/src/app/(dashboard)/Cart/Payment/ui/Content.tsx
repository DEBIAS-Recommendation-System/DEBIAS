"use client";
import { OpenFormProvider } from "../context/OpenFormProvider";
import ClientAddress from "./ClientAddress";
import OrderResume from "./OrderResume";
import PaymentOptions from "./PaymentOptions";
export type OpenPaymentFormType = "clientAddress" | "paymentOptions" | "none";

export default function Content() {
  return (
    <OpenFormProvider>
      <div className="flex w-full flex-col items-center justify-center gap-24 p-8 py-20 transition-all duration-500 lg:flex-row lg:items-start">
        <div className="flex w-full flex-col items-center gap-5 bg-white lg:w-7/12">
          <ClientAddress />
          <PaymentOptions />
        </div>
        <OrderResume />
      </div>
    </OpenFormProvider>
  );
}
