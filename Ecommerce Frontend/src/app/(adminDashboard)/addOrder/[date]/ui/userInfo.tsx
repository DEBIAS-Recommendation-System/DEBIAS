import React, { useState } from "react";

import { useToast } from "@/hooks/useToast";
import { SelectGeneric } from "@/app/ui/SelectGeneric";
import {
  State,
  states,
} from "@/app/(dashboard)/Cart/Payment/constants/statesAndCities";
import { useOrder } from "../context/useOrder";
import { useStep } from "../context/useStep";
import { z } from "zod";

const schema = z.object({
  first_name: z.string({ message: "First name is required" }).min(2, {
    message: "First name must be at least 2 characters",
  }),
  last_name: z
    .string({
      message: "Last name is required",
    })
    .min(2, {
      message: "Last name must be at least 2 characters",
    }),
  address: z
    .string({
      message: "address is required",
    })
    .min(4, {
      message: "address must be at least 4 characters",
    }),
  region: z.string({
    message: "Region is required",
  }),
  city: z.string({
    message: "City is required",
  }),
  phone_number: z
    .string({
      message: "Phone number is required",
    })
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),

  additional_info: z
    .string({
      message: "Additional info must be a string",
    })
    .optional(),
});


export default function UserInfo() {
  
  const { order, setOrder } = useOrder();
  const { setStep } = useStep();
  const { toast } = useToast();
  const [state, setState] = useState<State | undefined>();
  function saveOrderInfo(formData: FormData) {
    const data = {
      first_name: String(formData.get("first_name")),
      last_name: String(formData.get("last_name")),
      phone_number: String(formData.get("phone")),
      address: String(formData.get("email")),
      region: String(formData.get("state")),
      city: String(formData.get("city")),
      additional_info: String(formData.get("additional_info")),
    };
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      validationResult.error.errors.forEach((err) =>
        toast.error("Validation Error", err.message)
      );
      return; 
    }
    setOrder({
      id: 69,
      first_name: data.first_name,
      user_id: null,
      last_name: data.last_name,
      phone_number: data.phone_number,
      address: data.address,
      region: data.region,
      city: data.city,
      additional_info: data.additional_info,
      created_at: new Date().toISOString(),
      status: "pending",
      total_price: 69,
      wholesale_price: 69,
      payment_method: "cash",
      cancel_reason: "none",
    });

    toast.success(
      "User Information Saved Successfully!",
      "Continue Adding The Order Content",
    );
    setStep(2);
  }

  return (
    <form action={saveOrderInfo} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm font-semibold text-gray-900">First Name</div>
          <div className="text-sm font-semibold text-gray-900">Last Name</div>
          <div>
            <input
              className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              type="text"
              placeholder="first name..."
              name="first_name"
              defaultValue={order?.first_name}
              required
            />
          </div>
          <div>
            <input
              className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              type="text"
              placeholder="last name..."
              name="last_name"
              defaultValue={order?.last_name}
              required
            />
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-900">Email</div>
        <input
          className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
          type="email"
          placeholder="email..."
          name="email"
          defaultValue={order?.address}
          required
        />
        <div className="text-sm font-semibold text-gray-900">Phone</div>
        <input
          className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
          type="tel"
          placeholder="phone number..."
          name="phone"
          defaultValue={order?.phone_number}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm font-semibold text-gray-900">Region</div>
          <div className="text-sm font-semibold text-gray-900">City</div>
          <SelectGeneric
            variant="oversized"
            defaultValue={
              state ? { label: state?.state, value: state?.state } : undefined
            }
            name="state"
            inputLabel="State"
            onChange={(state: string) =>
              setState(states.find((e) => e.state === state))
            }
            options={states.map((e) => ({
              label: e.state,
              value: e.state,
            }))}
          />
          <SelectGeneric
            variant="oversized"
            defaultValue={
              order?.city
                ? {
                    label: order?.city,
                    value: order?.city,
                  }
                : undefined
            }
            name="city"
            inputLabel={state ? "City" : "Select a state"}
            group={true}
            options={state?.cities.map((e) => ({ label: e, value: e })) ?? []}
          />
        </div>

        <div className="text-sm font-semibold text-gray-900">Adress</div>
        <input
          className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
          type="text"
          placeholder="Username..."
          name="additional_info"
          defaultValue={order?.additional_info}
          required
        />
      </div>

      <button
        type="submit"
        className="right-0 mt-5 w-[10rem] rounded border border-slate-700 bg-slate-100 p-2 px-5 font-bold text-slate-700 duration-300 ease-in-out hover:bg-slate-600 hover:text-slate-200"
      >
        Save & Next
      </button>
    </form>
  );
}
