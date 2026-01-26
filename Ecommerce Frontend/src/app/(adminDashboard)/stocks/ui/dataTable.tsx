"use client";
import React, { useEffect, useState } from "react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import useProducts from "@/hooks/data/products/useProducts";
import productsIncome from "@/api/products/prodcutsIncome";
import { FaPen } from "react-icons/fa";
import Link from "next/link";
import DeleteProduct from "./deleteProduct";
import productsWholeSalePrice from "@/api/products/productWholesalePrice";

const DataTable = ({
  data,
}: {
  data: Array<{ id:string;product: string; stock: number; wholesale_price: number; price: number; income: number }>;
}) => {
  const [totalIncome, setTotalIncome] = useState<number | undefined>(0); // State for storing total income
  const [sortField, setSortField] = useState<keyof typeof data[0]>("product");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [totalWholesalePrice, setTotalWholesalePrice] = useState<number | undefined>(0);

  useEffect(() => {
    const fetchWholesalePrice = async () => {
      try {
        const {totaleWholesalePrice :wholesalePrice,error} = await productsWholeSalePrice();
        setTotalWholesalePrice(wholesalePrice);
      } catch (error) {
        console.error("Failed to fetch total wholesale price:", error);
      }
    };
    fetchWholesalePrice();

    const fetchIncome = async () => {
      try {
        const {totalIncome: income} = await productsIncome();
        setTotalIncome(income);
      } catch (error) {
        console.error("Failed to fetch total income:", error);
      }
    };

    fetchIncome();
  }, []);
  const sortedData = [...data].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: keyof typeof data[0]) => {
    setSortField(field);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div>
      <Table className="min-w-full table-auto">
        <TableHead className="px-0 bg-gray-100 text-base font-semibold">
          <TableRow className="grid grid-cols-11">
            <TableCell className="col-span-2 text-center" onClick={() => toggleSort("product")}>Product</TableCell>
            <TableCell className="col-span-2 text-center " onClick={() => toggleSort("stock")}>Stock</TableCell>
            <TableCell className="col-span-2 text-center" onClick={() => toggleSort("wholesale_price")}>Wholesale Price</TableCell>
            <TableCell className="col-span-2 text-center" onClick={() => toggleSort("price")}>Price</TableCell>
            <TableCell className="col-span-2 text-center" onClick={() => toggleSort("income")}>Income(dt)</TableCell>
            <TableCell className="col-span-1 text-center">Actions</TableCell>  {/* Add column for actions */}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Total Income Row */}
          <TableRow className="grid grid-cols-11 font-bold text-base ">
            <TableCell className="col-span-2 text-center">All Products</TableCell>
            <TableCell className="col-span-2 text-center">-</TableCell>
            <TableCell className="col-span-2 text-center">{totalWholesalePrice !== null ? totalWholesalePrice : "Loading..."}</TableCell>
            <TableCell className="col-span-2 text-center">-</TableCell>
            <TableCell className="col-span-2 text-center">{totalIncome !== null ? totalIncome : "Loading..."}</TableCell>
            <TableCell className="col-span-1 text-center"></TableCell>  {/* Add column for actions */}
          </TableRow>

          {/* Filtered and Sorted Data */}
          {sortedData.map((row) => (
            <TableRow key={row.product} className="grid grid-cols-11">
              <TableCell className="col-span-2 text-center">{row.product}</TableCell>
              <TableCell className="col-span-2 text-center">{row.stock}</TableCell>
              <TableCell className="col-span-2 text-center">{row.wholesale_price}</TableCell>
              <TableCell className="col-span-2 text-center">{row.price}</TableCell>
              <TableCell className="col-span-2 text-center">{row.income}</TableCell>
              <TableCell className="col-span-1 items-center flex justify-between  ">
                    <Link href={`/editProduct/${row.id}`}>
                      <FaPen className="size-[1rem] hover:text-gray-500" />
                  </Link>
                  <DeleteProduct  id={row.id} />          
              </TableCell>  
            </TableRow>
          ))}
        </TableBody>
        
      </Table>
    </div>
  );
};

export default DataTable;
