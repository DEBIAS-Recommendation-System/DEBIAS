import React from "react";
import getLocalValues from "@/helpers/getLocalValues";
import ClientAddressForm from "./ClientAddressForm";
import { useOpen } from "../context/OpenFormProvider";
import useTranslation from "@/translation/useTranslation";

export default function ClientAddress() {
  const { open: VisiblePaymentForm, setOpen } = useOpen();
  const { data: translation } = useTranslation();
  const defaultFormValues = getLocalValues("clientAddressForm");
  const isOpen = VisiblePaymentForm === "clientAddress";
  const open = () => setOpen("clientAddress");
  const close = () => setOpen("none");
  const next = () => setOpen("paymentOptions");
  return (
    <div className="w-full shadow-lg">
      <div className="flex justify-between">
        <h1 className="px-4 py-2"> 1. {translation?.lang["Client Address"]}</h1>
        {!isOpen && (
          <button
            onClick={open}
            className="px-4 transition-all duration-300 hover:text-blue-900 hover:underline"
          >
            {translation?.lang["modify"]}
          </button>
        )}
      </div>
      <hr />
      {!isOpen && (
        <div className="flex flex-col gap-2 p-4 text-gray-600">
          <div className="flex gap-2">
            <div>{defaultFormValues?.firstName ?? ""}</div>
            <div>{defaultFormValues?.lastName ?? ""}</div>
          </div>
          <h2>
            {defaultFormValues?.adress ?? ""} | {defaultFormValues?.state ?? ""}{" "}
            - {defaultFormValues?.city ?? ""} | +216{" "}
            {defaultFormValues?.telephone ?? ""}
          </h2>
        </div>
      )}
      {isOpen && <ClientAddressForm next={next} close={close} />}
    </div>
  );
}
