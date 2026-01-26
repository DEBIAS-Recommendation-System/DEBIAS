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
    <section className="px-6 py-20" aria-labelledby="products-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-row items-center justify-center gap-3">
          <Image
            src="/home/icons/flower_yellow.png"
            alt=""
            height={15}
            width={15}
          />
          <h2 
            id="products-heading"
            className="text-4xl font-bold uppercase text-color5 max-[830px]:text-3xl max-[530px]:text-2xl"
          >
            {translation?.lang["our products"]}
          </h2>
          <Image
            src="/home/icons/flower_yellow.png"
            alt=""
            height={15}
            width={15}
          />
        </div>
        <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 mb-12" />
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products?.data?.map((product, key) => (
              <Product key={key} {...product} />
            ))}
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Pagination
            count={products?.meta?.total_pages}
            page={page}
            boundaryCount={1}
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </div>
      </div>
    </section>
  );
}
