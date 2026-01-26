"use client" ;

import React, { useState } from "react";
import {Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";

const DataTable = ({ data }: { data: Array<{ product: string; purchased_count: number; income: number }> }) => {
  const [sortField, setSortField] = useState<keyof typeof data[0]>("product");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
    <Table className="min-w-full table-auto">
      <TableHead>
        <TableRow>
          <TableCell onClick={() => toggleSort("product")}>Product</TableCell>
          <TableCell onClick={() => toggleSort("purchased_count")}>Number Of Purchases</TableCell>
          <TableCell onClick={() => toggleSort("income")}>income</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedData.map((row) => (
          <TableRow key={row.product}>
            <TableCell>{row.product}</TableCell>
            <TableCell>{row.purchased_count}</TableCell>
            <TableCell>{row.income}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DataTable;
