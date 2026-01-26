"use client";
import { SelectGeneric } from "@/app/ui/SelectGeneric";
import { getLastDayOfMonth } from "@/helpers/getLastDayOfMonth";
import useOrders from "@/hooks/data/orders/useOrders";
import { useState, useEffect } from "react";

export default function LastYearIncome() {
  const [date, setDate] = useState(''); 
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    const generateLast12Months = () => {
      const months = [{ label: 'Last 12 Months', value: 'last-12-months' }]; 
      const currentDate = new Date();
      let currentYear = currentDate.getFullYear();
      let currentMonth = currentDate.getMonth() + 1;

      for (let i = 0; i < 12; i++) {
        if (currentMonth < 1) {
          currentMonth = 12;
          currentYear -= 1;
        }
        const monthLabel = new Date(currentYear, currentMonth - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });
        const monthValue = `${currentYear}-${String(currentMonth).padStart(2, '0')}`; 
        months.push({ label: monthLabel, value: monthValue });
        currentMonth--; 
      }
      return months;
    };

    setOptions(generateLast12Months());
  }, []);

  const dateRange = () => {
    if (date === 'last-12-months') {
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 11); 
      return {
        from: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00`,
        to: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(getLastDayOfMonth(endDate.getFullYear(), endDate.getMonth() + 1)).padStart(2, '0')}T23:59:59`,      };
    } else if (date) {
      return {
        from: `${date}-01T00:00:00`,
        to: `${date}-${String(getLastDayOfMonth(Number(date.split("-")[0]), Number(date.split("-")[1]))).padStart(2, '0')}T23:59:59`,
      };
    }
    return undefined; 
  };

  const { data: orders, isLoading /*, count : number_of_orders*/ } = useOrders({
    date: dateRange(),
    columns: ["total_price", "wholesale_price"],
    status: "fulfilled",
  });

  let total_income = orders?.data.reduce((acc, order) =>
    acc + (order.total_price - order.wholesale_price), 0);

  return (
    <div className="flex flex-col gap-3 w-full p-4">
      <SelectGeneric
        defaultValue={{ label: 'Last 12 Months', value: 'last-12-months' }} 
        onChange={(e) => setDate(e)}
        className="placeholder:text-sm placeholder:text-gray-300 sm:col-span-4 w-full"
        options={options} 
      />

      <div className="flex justify-between w-[50%]">
        <div>Total Income : {total_income ?? 0} dt</div>
        <div>Number Of Orders : {orders?.data.length}</div>
      </div>
    </div>
  );
}

