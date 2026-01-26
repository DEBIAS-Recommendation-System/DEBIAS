"use client";
import React, { useState } from "react";
import Image from "next/image";
import { StockPaginationProvider, useStockPagination } from "./context/useStockPagination";
import Table from "./ui/table";
import { SearchIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

function ProductListPage() {
  const [searchQuery, setSearchQuery] = useState<string>(""); // State for search query
  const { page, setPage } = useStockPagination();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPage(1);
    setSearchQuery(event.target.value);
  }

  return (
    <div className="flex flex-col mt-20 gap-12 w-[60rem] m-auto pb-5">
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-2xl font-bold uppercase text-color5">
          Product List
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
      </div>

      <div className="flex flex-row gap-1 items-center border-gray-200 border-2 px-2 w-[40rem] m-auto">
      <SearchIcon size={20} />
      <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleChange}
          className="w-96 p-3 hover:border-none focus:outline-none"
        />
      </div>

      <Table searchQuery={searchQuery} />
    </div>
  );
}

export default function Page() {
  return (
    <StockPaginationProvider>
      <ProductListPage />
    </StockPaginationProvider>
  );
}
