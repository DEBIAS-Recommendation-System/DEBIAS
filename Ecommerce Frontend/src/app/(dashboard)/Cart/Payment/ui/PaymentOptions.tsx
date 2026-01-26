import React from "react";
import PaymentOptionsForm from "./PaymentOptionsForm";
import getLocalValues from "@/helpers/getLocalValues";
import { useOpen } from "../context/OpenFormProvider";
import useTranslation from "@/translation/useTranslation";

export default function PaymentOptions() {
  const { open: VisiblePaymentForm, setOpen } = useOpen();
  const isOpen = VisiblePaymentForm === "paymentOptions";
  const open = () => setOpen("paymentOptions");
  const close = () => setOpen("none");
  const paymentOption = getLocalValues("paymentOptionsForm").paymentOption;
  const { data: translation } = useTranslation();
  return (
    <div className="w-full shadow-lg">
      <div className="flex justify-between">
        <h1 className="px-4 py-2">2. {translation?.lang["PAYMENT OPTIONS"]}</h1>
        {isOpen || (
          <button
            onClick={open}
            className="px-4 transition-all duration-300 hover:text-blue-900 hover:underline"
          >
            {translation?.lang["modify"]}
          </button>
        )}
      </div>
      {isOpen || (
        <div className="p-4 text-gray-500">
          <h1>
            {translation?.lang["Payment Method"]} : {paymentOption}
          </h1>
        </div>
      )}
      {isOpen && <PaymentOptionsForm close={close} />}
    </div>
  );
}
