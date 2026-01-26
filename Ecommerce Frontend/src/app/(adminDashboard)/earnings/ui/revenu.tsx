"use client";
import { SelectGeneric } from '@/app/ui/SelectGeneric';
import useOrders from '@/hooks/data/orders/useOrders';
import React, { useMemo, useState } from 'react';
import { subWeeks, subMonths, subYears, format, eachDayOfInterval } from 'date-fns';
import { Tables } from '@/types/database.types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import { Player } from '@lottiefiles/react-lottie-player';

export default function Revenu() {
  const [time, setTime] = useState<string>('week');
  const startDate = useMemo(() => {
    const now = new Date();
    if (time === 'week') {
      return subWeeks(now, 1);
    } else if (time === 'month') {
      return subMonths(now, 1);
    } else {
      return subMonths(now, 3);
    }
  }, [time]);
  
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const { data: purchases } = useOrders({
    sort : {ascending : false , column:'created_at'},
    status: "fulfilled",
    filter: {
      column: 'created_at',
      value: formattedStartDate,
      operator: 'gte',
    },
  });
  const generateFullDateRange = (start: Date, end: Date) => {
    return eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
  };
  const groupByDay = (data: Tables<"orders">[], dateRange: string[]) => {
    const grouped: Record<string, number> = {};
    dateRange.forEach(date => {
      grouped[date] = 0;
    });

    data.forEach((purchase) => {
      const dateKey = format(new Date(purchase.created_at), 'yyyy-MM-dd');
      const income = purchase.total_price - purchase.wholesale_price;
      if (grouped[dateKey]) {
        grouped[dateKey] += income;
      } else {
        grouped[dateKey] = income;
      }
    });
    return Object.keys(grouped).map(date => ({
      date,
      income: grouped[date],
    }));
  };
  const incomeData = useMemo(() => {
    if (!purchases?.data) return [];

    const now = new Date();
    const fullDateRange = generateFullDateRange(startDate, now); 
    return groupByDay(purchases.data, fullDateRange);
  }, [purchases, startDate]);
  
  const options: { label: string; value: string }[] = [
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "Last 3 Months", value: "3months" },
  ];
  

  const CustomTooltip = ({ active, payload, label }: { active: boolean; payload: any[]; label: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '5px', border: '1px solid #ccc' }}>
          <label>{`${label} : ${payload[0].value}dt`}</label>
        </div>
      );
    }
    return null;
  };
  CustomTooltip.defaultProps = {
    active: false,
    payload: [],
    label: '',
  };
  const xAxisTickFormatter = (date: string, index: number) => {
    const totalDates = incomeData.length;
    if (totalDates === 0) return '';
    const indicesToShow = [
      0, 
      Math.floor(totalDates / 3), 
      Math.floor(totalDates * 2 / 3), 
      totalDates - 1
    ];
    if (indicesToShow.includes(index)) {
      return date;
    }
      const today = format(new Date(), 'yyyy-MM-dd');
    if (date === today) {
      return date;
    }
    return '';
  };
return (
    <div className='flex flex-col gap-4 '>
      <div className='flex flex-col sm:px-7 sm:flex-row justify-between items-center gap-4'>
        <div className='text-slate-700 text-lg md:text-xl font-semibold'>Revenue</div>
        <SelectGeneric
          defaultValue={{ value: 'week', label: 'Last Week' }}
          onChange={(e) => setTime(e)}
          className="placeholder:text-sm placeholder:text-gray-300"
          options={options}
        />
      </div>
  
      {incomeData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={incomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={xAxisTickFormatter} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="income" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="m-auto flex items-center justify-center">
          <Player autoplay loop src="/AnimationLoading.json" style={{ height: "12rem", width: "12rem" }} />
        </div>
      )}
    </div>
  );
}
