"use client";
import useOrders from "@/hooks/data/orders/useOrders";
import { Tables } from "@/types/database.types";
import React, { useState, useEffect } from "react";
import Day from "./ui/day";
import Image from "next/image";
import { SelectGeneric } from "@/app/ui/SelectGeneric";
import getOldestOrder from "@/api/Orders/getOldestOrder";
import { getLastDayOfMonth } from "@/helpers/getLastDayOfMonth";
import { Player } from "@lottiefiles/react-lottie-player";

export const dynamic = 'force-dynamic';

export default function Page() {
  const currentDate = new Date();
  const today = currentDate.getDate();
  const thisyear = currentDate.getFullYear();
  const thismonth = currentDate.getMonth() + 1; // Month is 0-based
  const [oldestOrderDate, setOldestOrderDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${thisyear}-${thismonth < 10 ? `0${thismonth}` : thismonth}`
  );
  const [startDate, setStartDate] = useState<Date>(new Date(thisyear, thismonth-1 , 2));
  const [endDate, setEndDate] = useState<Date>(new Date(thisyear, thismonth - 1, today+1));
  useEffect(() => {
    const fetchOldestOrder = async () => {
      const result = await getOldestOrder();
      if (result.oldestOrder) {
        setOldestOrderDate(new Date(result.oldestOrder));
      }
    };
    fetchOldestOrder();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    const [selectedYear, selectedMonthStr] = selectedMonth.split("-");
    const selectedYearNumber = Number(selectedYear);
    const selectedMonthNumber = Number(selectedMonthStr)-1;
    let lastDayOfMonth = getLastDayOfMonth(selectedYearNumber, selectedMonthNumber + 1);
    if ( thismonth === Number(selectedMonthStr)){
      lastDayOfMonth = today 
    }
    setStartDate(new Date(selectedYearNumber, selectedMonthNumber, 2));
    setEndDate(new Date(selectedYearNumber, selectedMonthNumber, lastDayOfMonth+1));
  }, [selectedMonth]);
  const generateMonthOptions = (): { label: string; value: string }[] => {
    if (!oldestOrderDate) return [];

    const options = [];
    let iteratingDate = new Date();
    while (iteratingDate >= oldestOrderDate) {
      const year = iteratingDate.getFullYear();
      const month = iteratingDate.getMonth() + 1; // getMonth is 0-based
      const monthName = iteratingDate.toLocaleString("default", { month: "long" });
      const value = `${year}-${String(month).padStart(2, "0")}`;

      options.push({
        label: `${year} ${monthName}`,
        value: value,
      });
      iteratingDate.setMonth(iteratingDate.getMonth() - 1);
    }
    return options;
  };
  const monthOptions = generateMonthOptions();
  const { data: orders, isLoading, error } = useOrders({
    columns:["total_price", "wholesale_price","created_at","status"],
    sort: { ascending: false, column: "created_at" },
    date: {
      from: `${startDate.toISOString().split("T")[0]}T00:00:00`,
      to: `${endDate.toISOString().split("T")[0]}T23:59:59`,
    },
  });
  if (error) return <div>Error: {error.message}</div>;
  const groupedOrders = orders?.data?.reduce(
    (acc: Record<string, Tables<"orders">[]>, order: Tables<"orders">) => {
      const orderDate = new Date(order.created_at).toISOString().split("T")[0];
      if (!acc[orderDate]) {
        acc[orderDate] = [];
      }
      acc[orderDate].push(order);
      return acc;
    },
    {}
  );
  const allDaysOfMonth: Record<string, Tables<"orders">[]> = {};
  let iteratingDate = new Date(startDate);
  let lastday = new Date(endDate);
  while (iteratingDate <= lastday) {
    const formattedDate = iteratingDate.toISOString().split("T")[0];
    allDaysOfMonth[formattedDate] = groupedOrders?.[formattedDate] || [];
    iteratingDate.setDate(iteratingDate.getDate() + 1);
  }
  const reversedDates = Object.keys(allDaysOfMonth).reverse();
  return (
    <div className="w-[50rem] mt-20 m-auto">
      <div className="flex flex-row items-center justify-center gap-2 md:gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt="Yellow Flower"
          height={15}
          width={15}
        />
        <div className="text-xl md:text-2xl font-bold uppercase text-color5">
          Orders of {selectedMonth}
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt="Yellow Flower"
          height={15}
          width={15}
        />
      </div>
      {isLoading ? (
        <div className="m-auto flex mt-[10rem] items-center justify-center">
        <Player
          className="m-auto"
          autoplay
          loop
          src="/AnimationLoading.json"
          style={{ height: "10rem", width: "10rem" }}
        />
      </div>
      ) : (
        <div className="mt-5">
              <SelectGeneric
                name="months"
                options={monthOptions}
                defaultValue={monthOptions.find((option) => option.value === selectedMonth)}
                onChange={(value) => setSelectedMonth(value)}
              />
          <div className="grid grid-cols-3 gap-5 text-slate-900 text-lg font-bold mt-10 px-5">
            <div>Day</div>
            <div>Total Orders</div>
            <div>Total Revenue</div>
          </div>
          <div className="flex flex-col gap-2 mt-5">
            {reversedDates.map((date) => (
              <Day key={date} date={date} orders={allDaysOfMonth[date]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
}
