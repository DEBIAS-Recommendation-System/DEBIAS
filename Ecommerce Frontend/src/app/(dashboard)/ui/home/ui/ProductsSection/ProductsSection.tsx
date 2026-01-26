"use client";
import Image from "next/image";
import useProducts from "@/hooks/data/products/useProducts";
import { useEffect, useState } from "react";
import { Pagination } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { productsQuery } from "@/hooks/data/products/productsQuery";
import { useMemo } from "react";
import useTranslation from "@/translation/useTranslation";
import Loading from "@/app/(adminDashboard)/loading";
import Product from "./Product";

export function ProductsSection() {
  const [page, setPage] = useState(1);
  const limit = 8;
  const sort = useMemo(
    () => ({
      column: "discount" as const,
      ascending: false,
    }),
    [],
  );
  const { data: products, isLoading } = useProducts({ page, limit, sort });
  const queryClient = useQueryClient();
  useEffect(() => {
    if (products?.meta?.has_next_page) {
      queryClient.prefetchQuery(
        productsQuery({
          page: page + 1,
          limit,
          sort,
        }),
      );
    }
  }, [page, products?.meta?.has_next_page, sort, queryClient]);
  const { data: translation } = useTranslation();
  return (
    <div className="my-20 flex min-h-screen flex-col gap-12">
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-2xl font-bold uppercase text-color5">
          {translation?.lang["our products"]}
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
      </div>
      {isLoading ? (
        <div className="h-full w-full items-center justify-center">
          <Loading />
        </div>
      ) : (
        <div className="mx-auto grid min-h-screen w-fit grid-cols-4 gap-x-10 gap-y-10 max-[1150px]:grid-cols-3 max-[830px]:grid-cols-2">
          {products?.data?.map((product, key) => (
            <Product key={key} {...product} />
          ))}
        </div>
      )}
      <Pagination
        className="flex w-full justify-center"
        count={products.meta?.total_pages}
        page={page}
        boundaryCount={1}
        onChange={(e, value) => setPage(value)}
      />
    </div>
  );
}
