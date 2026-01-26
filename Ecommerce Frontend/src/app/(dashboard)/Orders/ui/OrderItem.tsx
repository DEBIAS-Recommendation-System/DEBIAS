import useTranslation from "@/translation/useTranslation";
import { Tables } from "@/types/database.types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function OrderItem({
  order,
}: {
  order: Tables<"orders"> | null;
}) {
  const { data: translation } = useTranslation();
  if (!order) return null;
  return (
    <Link href={`/Orders/${order.id}`}>
      <div className="flex w-full flex-row items-center gap-2 rounded-md bg-gray-100 p-3 shadow-sm transition-all duration-200 hover:shadow-md max-sm:flex-col ">
        <div className="flex w-3/12 flex-col gap-2 max-sm:w-[9rem]">
          {order.status === "cancelled" && (
            <div className="flex flex-col items-center">
              <Image
                src="/Orders/orderCancelled.png"
                alt="order"
                width={100}
                className="max-sm:w-[5rem]"
                height={100}
              />{" "}
              <h1 className="px-2 font-semibold capitalize text-color1">
                {order.status} ❌
              </h1>
            </div>
          )}
          {order.status === "pending" && (
            <div className="flex flex-col items-center">
              <Image
                src="/Orders/orderPending.png"
                alt="order"
                width={100}
                height={100}
              />{" "}
              <h1 className="font-semibold capitalize text-color5">
                {order.status} 🕛
              </h1>
            </div>
          )}
          {order.status === "approved" && (
            <div className="flex flex-col items-center">
              <Image
                src="/Orders/orderApproved.png"
                alt="order"
                width={100}
                height={100}
              />{" "}
              <h1 className="font-semibold capitalize text-color6">
                {order.status} 👍
              </h1>
            </div>
          )}
          {order.status === "fulfilled" && (
            <div className="flex flex-col items-center">
              <Image
                src="/Orders/orderFulfilled.png"
                alt="order"
                width={100}
                height={100}
              />{" "}
              <h1 className="font-semibold capitalize text-green-500">
                {order.status} ✅
              </h1>
            </div>
          )}
        </div>
        <div className="grid w-9/12 grid-cols-2 gap-2 rounded-md border border-gray-300 bg-gray-50 p-3 max-sm:w-[95%]">
          <div className="flex gap-2 max-sm:col-span-2">
            <h1 className="font-semibold">Date :</h1>{" "}
            <h1>{order.created_at.substring(0, 10)}</h1>
          </div>
          <div className="text-right font-semibold max-sm:col-span-2 max-sm:text-left">
            Total : {order.total_price<100 ? order.total_price+ 8 : order.total_price} TND
          </div>
          <div className="col-span-2 flex gap-2">
            <h1 className="text-nowrap font-semibold">
              {translation?.lang["Full name"]} :
            </h1>
            <div className="text-nowrap max-sm:overflow-scroll">
              {order.first_name + " " + order.last_name}
            </div>
          </div>
          <div className="col-span-2 flex flex-wrap gap-2">
            <h1 className="font-semibold max-sm:col-span-2">email :</h1>
            <div className="max-sm:col-span-2 max-sm:overflow-scroll">
              {order.address}
            </div>
          </div>
          <div className="col-span-2 flex flex-wrap gap-2">
            <h1 className="text-nowrap font-semibold max-sm:col-span-2">
              {translation?.lang["phone number"]} :
            </h1>
            <div className="max-sm:col-span-2">{order.phone_number}</div>
          </div>
          <div className="flex gap-2 max-sm:col-span-2">
            <h1 className="font-semibold">{translation?.lang["To"]} : </h1>
            <div className="text-nowrap max-sm:overflow-scroll">
              {order.city} - {order.region}
            </div>
          </div>
          <div className="col-span-2">
            <h1 className="text-nowrap font-semibold">
              {translation?.lang["additional informations"]} :
            </h1>
            <div className="overflow-scroll text-nowrap">
              {order.additional_info}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="col-span-2 flex gap-2">
              <h1 className="text-nowrap font-semibold">
                {translation?.lang["payment method"]} :{" "}
              </h1>
              <div className="">{order.payment_method}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
