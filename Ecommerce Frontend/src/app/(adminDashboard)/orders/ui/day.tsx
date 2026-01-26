"use client";
import { Tables } from '@/types/database.types';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';

export default function Day({ date, orders }: { orders: Tables<"orders">[]; date: string }) {
  const [hasCancelledOrder, setHasCancelledOrder] = useState<boolean>(false); // State for cancelled orders
  const [hasPendingOrder, setHasPendingOrder] = useState<boolean>(false); // State for pending orders
  const totalIncome= orders.reduce ((sum, order) => sum + order.total_price - order.wholesale_price, 0);


  useEffect(() => {
    setHasCancelledOrder(orders.some((order: Tables<"orders">) => order.status === 'cancelled'));
    setHasPendingOrder(orders.some((order: Tables<"orders">) => order.status === 'pending')); 
  }, [date]);

  let statusIcon;
  if (hasCancelledOrder) {
    statusIcon = <div className="text-3xl font-bold text-red-600 mr-3 ">!!</div>;
  } else if (hasPendingOrder) {
    statusIcon = <div className="text-3xl font-bold text-yellow-500 mr-4 ">!</div>;
  } else {
    statusIcon = <FaCheck className="text-green-600 text-xl text-center mr-3" />;
  }

  return (
    <Link href={`/dateOrders/${date}`}>
      <div
        key={date}
        className="py-5 px-5 cursor-pointer shadow-lg grid grid-cols-3 gap-5 font-semibold text-slate-700 bg-white rounded-lg transition-all duration-300 transform hover:bg-blue-50 hover:shadow-xl hover:scale-105"
      >
        <h2>{date}</h2>
        <h2>{orders.length} Orders</h2>
        <div className="flex justify-between">
          <h2>{totalIncome !== null ? `${totalIncome}dt` : 'Loading...'}</h2>
          <div>{statusIcon}</div>
        </div>
      </div>
    </Link>
  );
}
