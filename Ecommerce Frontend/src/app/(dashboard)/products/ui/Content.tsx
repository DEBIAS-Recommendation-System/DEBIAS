"use client";
import useProducts from "@/hooks/data/products/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { productsQuery } from "@/hooks/data/products/productsQuery";
import { Pagination } from "@mui/material";
import { SelectGeneric, SelectGenericOption } from "@/app/ui/SelectGeneric";
import { Tables } from "@/types/database.types";
import { useEffect, useState } from "react";
import FiltersLaptop from "./FiltersLaptop";
import FiltersPhone from "./FiltersPhone";
import { ToggleSortArrow } from "./ToggleSortArrow";
import useTranslation from "@/translation/useTranslation";
import { Spinner } from "@/app/ui/Spinner";
import { Player } from "@lottiefiles/react-lottie-player";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useCategories from "@/hooks/data/categories/useCategories";
import createNewPathname from "@/helpers/createNewPathname";
import Product from "../../ui/home/ui/ProductsSection/Product";
export interface ProductsFilterType {
  minDiscount: number;
  priceRange: [number, number];
  category_id: number | null;
}
export default function Content() {
  const { data: translation } = useTranslation();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: categories } = useCategories();
  const filters: ProductsFilterType = {
    category_id:
      categories?.data?.find((e) => e.name === searchParams.get("category"))
        ?.id ?? null,
    priceRange: [
      Number(searchParams.get("minPrice")),
      Number(searchParams.get("maxPrice")),
    ],
    minDiscount: Number(searchParams.get("discount")),
  };
  const sortOptions = [
    {
      label: translation?.lang["price"],
      value: "price",
    },
    {
      label: translation?.lang["Newest"],
      value: "created_at",
    },
    {
      label: translation?.lang["Products on sale"],
      value: "discount",
    },
    {
      label: translation?.lang["Name"],
      value: "title",
    },
  ] as const;
  const page = Number(searchParams.get("page") ?? 1);
  const [sort, setSort] = useState({
    column: "created_at" as keyof Tables<"products">,
    ascending: false,
  });
  const limit = 18;
  const queryArgs = {
    page,
    limit,
    sort,
    filters,
    match: filters.category_id
      ? { category_id: filters.category_id }
      : undefined,
  };
  const { data: products, isLoading } = useProducts(queryArgs);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (products?.meta?.has_next_page) {
      queryClient.prefetchQuery(
        productsQuery({
          ...queryArgs,
          page: page + 1,
        }),
      );
    }
  }, [page, products?.meta?.has_next_page, sort, filters, queryClient]);
  return (
    <div dir={translation?.default_language ==="ar" ? "rtl" : "ltr"}  className="mx-auto flex flex-row gap-12 max-[830px]:gap-0">
      <FiltersLaptop />
      <div className="mt-10 flex flex-col gap-12">
        <div className="flex flex-row items-center gap-6 max-[515px]:gap-3">
          <FiltersPhone />
          <SelectGeneric
            options={sortOptions as unknown as SelectGenericOption[]}
            inputLabel={translation?.lang["Sort"]}
            onChange={(value) => {
              if (value !== sort.column) {
                setSort((prev) => ({
                  ...prev,
                  column: value as keyof Tables<"products">,
                }));
              }
            }}
          />
          <ToggleSortArrow
            onClick={(value) => {
              if (value !== sort.ascending) {
                setSort((prev) => ({
                  ...prev,
                  ascending: value,
                }));
              }
            }}
          />
          <span className="text-xl font-bold text-color8 max-[515px]:text-sm">
            {products?.meta?.total_count ?? 0} {(products?.meta?.total_count ?? 0) > 1 ? translation?.lang["Products"] : translation?.lang["product"]}
          </span>
        </div>
        {isLoading ? (
          <div className="flex min-h-screen w-screen max-w-[50rem] items-start justify-center pt-[20%]">
            <Spinner className="size-12 self-center justify-self-center" />
          </div>
        ) : products.data && products.data.length > 0 ? (
          <div className="mx-auto grid min-h-screen w-[50rem] grid-cols-3 gap-x-10 gap-y-10 max-[1150px]:w-max max-[1150px]:grid-cols-2 max-[830px]:grid-cols-2">
            {products.data.map((product, key) => (
              <Product key={key} {...product} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-screen w-screen max-w-[50rem] items-start justify-center pt-[20%]">
            <Player
              src={
                "https://lottie.host/fb8aeca5-0f35-4b8c-bd0e-853461ff27a0/gcsVrueMx1.json"
              }
              className="h-60 w-60"
              loop
              autoplay
            />
          </div>
        )}

        <Pagination
          className="flex w-full justify-center"
          count={products?.meta?.total_pages}
          page={page}
          dir="ltr"
          boundaryCount={1}
          onChange={(e, value) => {
            router.push(
              createNewPathname({
                currentPathname: pathname,
                currentSearchParams: searchParams,
                values: [
                  {
                    name: "page",
                    value: String(value),
                  },
                ],
              }),
            );
          }}
        />
      </div>
    </div>
  );
}
