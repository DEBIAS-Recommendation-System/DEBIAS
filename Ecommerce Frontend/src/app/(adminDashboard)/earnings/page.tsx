"use client";
import React from 'react';
import Image from 'next/image';
import Revenu from './ui/revenu';
import LastYearIncome from './ui/lastYearIncome';

export default function Page() {
  return (
    <div className='flex flex-col gap-5 w-[90%] max-w-[60rem] m-auto mt-10 md:mt-20'>
      <div className="flex flex-row items-center justify-center gap-2 md:gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt="Yellow Flower"
          height={15}
          width={15}
        />
        <div className="text-xl md:text-2xl font-bold uppercase text-color5">
          Earnings
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt="Yellow Flower"
          height={15}
          width={15}
        />
      </div>
      <LastYearIncome />
      <Revenu />

    </div>
  );
}
