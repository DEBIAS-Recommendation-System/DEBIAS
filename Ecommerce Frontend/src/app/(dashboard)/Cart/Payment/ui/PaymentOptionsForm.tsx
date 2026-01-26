"use client";
import getLocalValues from "@/helpers/getLocalValues";
import postLocalValues from "@/helpers/postLocalValues";
import { useToast } from "@/hooks/useToast";
import useTranslation from "@/translation/useTranslation";
import { PaymentMethodEnum } from "@/types/database.tables.types";
import React, { useEffect, useState } from "react";

export default function PaymentOptionsForm({ close }: { close: () => void }) {
  const { toast } = useToast();
  const { data: translation } = useTranslation();
  const defaultValues = getLocalValues("paymentOptionsForm");
  const [selectedOption, setSelectedOption] = useState<
    PaymentMethodEnum.CASH | PaymentMethodEnum.ONLINE
  >(PaymentMethodEnum.CASH);
  useEffect(() => {
    if (!defaultValues.paymentOption) return;
    if (defaultValues.paymentOption in PaymentMethodEnum) {
      setSelectedOption(defaultValues.paymentOption);
    }
  }, [defaultValues]);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    postLocalValues("paymentOptionsForm", event);
    toast.success(translation?.lang["Payment method saved successfully"] ?? "");
    close();
  };

  return (
    <form className="p-6" onSubmit={handleSubmit}>
      <div className="mb-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentOption"
            value="cash"
            id="cash"
            checked={selectedOption === PaymentMethodEnum.CASH}
            onChange={() => setSelectedOption(PaymentMethodEnum.CASH)}
            className="h-5 w-5 transform rounded-full border-0 transition duration-300 ease-out checked:scale-125"
          />
          <label htmlFor="cash" className="text-lg font-semibold">
            {translation?.lang["Pay later"]}
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {translation?.lang["Pay later description"]}
        </p>
        {selectedOption === PaymentMethodEnum.CASH && (
          <div className="mt-3 rounded bg-gray-100 p-3">
            <p className="text-sm text-gray-700">
              {translation?.lang["pay on delivery"]}
              <a href="#" className="ml-1 text-indigo-500">
                {translation?.lang["Details"]}
              </a>
            </p>
            <div className="mt-2 flex items-center justify-end">
              <span className="mr-2 text-sm text-gray-500">
                {translation?.lang["we accept"]}:
              </span>
              <span className="text-2xl text-yellow-400">💳</span>
              <span className="ml-2 text-2xl text-yellow-400">💵</span>
            </div>
          </div>
        )}
      </div>

      {/* <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentOption"
            value="online"
            id="online"
            checked={selectedOption === PaymentMethodEnum.ONLINE}
            onChange={() => setSelectedOption(PaymentMethodEnum.ONLINE)}
            className="h-5 w-5 transform rounded-full border-2 border-gray-300 text-orange-500 transition duration-300 ease-out checked:scale-125"
          />
          <label htmlFor="online" className="text-lg font-semibold">
            {translation?.lang["pay online now!"]}
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {translation?.lang["You can pay with your Sfari balance"]}
        </p>
        {selectedOption === PaymentMethodEnum.ONLINE && (
          <div className="mt-3 rounded bg-gray-100 p-3">
            <h1 className="mb-3 w-fit rounded-md bg-color1 p-2 text-white">
              {translation?.lang["Your Sfari balance"]} : 0.00TND
            </h1>
            <hr />
            <p className="mt-2 text-sm text-gray-700">
              {
                translation?.lang[
                  `Pay for your purchases through Sfari, using your Mastercard or Visa card. You will be redirected to our SfariPay payment platform to complete your purchase. Make sure your payment details are up to date and that you have the necessary funds.`
                ]
              }
              <a href="#" className="ml-1 text-indigo-500">
                {translation?.lang["Details"]}
              </a>
            </p>
            <div className="mt-2 flex items-center justify-end">
              <span className="mr-2 text-sm text-gray-500">
                {translation?.lang["we accept"]}:
              </span>
              <span className="text-2xl text-yellow-400">💳</span>
              <span className="ml-2 text-2xl text-yellow-400">💵</span>
            </div>
          </div>
        )}
      </div> */}

      <div className="flex justify-end gap-2 text-right">
        <button
          onClick={close}
          className="rounded-md bg-red-400 px-4 py-2 font-semibold text-white transition-all duration-300 hover:bg-red-500 hover:shadow-sm hover:shadow-red-500"
        >
          {translation?.lang["Cancel"]}
        </button>
        <button
          type="submit"
          className="rounded bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
        >
          {translation?.lang["CONFIRM PAYMENT METHOD"]}
        </button>
      </div>
    </form>
  );
}
