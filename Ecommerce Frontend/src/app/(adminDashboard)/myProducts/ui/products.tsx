import { productsQuery } from "@/hooks/data/products/productsQuery";
import useProducts from "@/hooks/data/products/useProducts";
import { Player } from "@lottiefiles/react-lottie-player";
import { Pagination } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import Product from "./Product";
import { useProductsPagination } from "../context/useProductsPagination";

export default function Products({ searchQuery }: { searchQuery: string }) {
  const { page, setPage } = useProductsPagination(); 
  const limit = 8;
  const { data: products, isLoading } = useProducts({
    page,
    limit,
    search: { column: "title", value: searchQuery },
  }); 
  const queryClient = useQueryClient();

  useEffect(() => {
    if (products?.meta?.has_next_page) {
      queryClient.prefetchQuery(
        productsQuery({
          page: page + 1,
          limit,
        }),
      );
    }
  }, [page, products?.meta?.has_next_page, queryClient]);

  if (isLoading) {
    return (
      <div className="mt-[10rem] flex justify-center items-center">
        <Player
          className="m-auto"
          autoplay
          loop
          src="/AnimationLoading.json"
          style={{ height: "10rem", width: "10rem" }}
        />
      </div>
    );
  }

  if (!products?.data?.length) {
    return <div>No products found</div>;
  }

  return (
    <div className="m-auto flex justify-center w-full max-w-7xl flex-col gap-5">
      <div className="mx-auto grid w-full grid-cols-1 items-center justify-center  md:grid-cols-2 xl:grid-cols-4 lg:grid-cols-3 gap-x-6 gap-y-10 justify-items-center">
        {products?.data?.map((product, key) => (
          <Product key={key} {...product} />
        ))}
      </div>

      <Pagination
        className="flex w-full justify-center"
        count={products?.meta?.total_pages}
        page={page}
        boundaryCount={3}
        siblingCount={3}
        onChange={(e, value) => setPage(value)}
      />
    </div>
  );
}
