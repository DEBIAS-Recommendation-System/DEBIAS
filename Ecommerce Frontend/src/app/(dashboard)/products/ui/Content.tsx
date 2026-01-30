"use client";
import useFormattedProducts from "@/hooks/data/products/useFormattedProducts";
import { useCategories as useFastAPICategories } from "@/hooks/fastapi/useCategories";
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
import { Player } from "@/components/LottiePlayer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const { data: categoriesData } = useFastAPICategories();
  const categories = categoriesData?.data || [];
  
  // Parse search params with validation
  const categoryParam = searchParams.get("category");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const discountParam = searchParams.get("discount");
  
  const filters: ProductsFilterType = {
    category_id: null, // Deprecated: using category name instead
    priceRange: [
      minPriceParam ? Number(minPriceParam) : 0,
      maxPriceParam ? Number(maxPriceParam) : 0,
    ],
    minDiscount: discountParam ? Number(discountParam) : 0,
  };
  
  // Only include filters that have actual values (not defaults)
  const activeFilters: Partial<ProductsFilterType> = {};
  if (discountParam && !isNaN(Number(discountParam))) {
    activeFilters.minDiscount = Number(discountParam);
  }
  if (minPriceParam && maxPriceParam && !isNaN(Number(minPriceParam)) && !isNaN(Number(maxPriceParam))) {
    activeFilters.priceRange = [Number(minPriceParam), Number(maxPriceParam)];
  }
  
  const sortOptions = [
    {
      label: translation?.lang["price"],
      value: "price",
    },
    {
      label: translation?.lang["Newest"],
      value: "product_id", // Sort by product_id instead of created_at since we don't have that field
    },
    // Commented out - products don't have discounts yet
    // {
    //   label: translation?.lang["Products on sale"],
    //   value: "discount",
    // },
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
    filters: activeFilters,
    category: categoryParam || undefined,
  };
  
  const { data: products, isLoading } = useFormattedProducts(queryArgs);
  console.log("Query args:", queryArgs);
  console.log("Products data:", products);
  const productsList = products?.data || [];
  const isLastPage = productsList.length < limit;
  const totalPages = products?.meta?.total_pages || (isLastPage ? page : page + 1);
  
  const queryClient = useQueryClient();
  
  // Prefetch next page only if not on last page
  useEffect(() => {
    if (!isLastPage && products?.meta?.has_next_page) {
      const timer = setTimeout(() => {
        queryClient.prefetchQuery(
          productsQuery({
            ...queryArgs,
            page: page + 1,
          }),
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [page, isLastPage, products?.meta?.has_next_page, queryClient]);
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
            {products?.data?.length ?? 0} {(products?.data?.length ?? 0) > 1 ? translation?.lang["Products"] : translation?.lang["product"]}
          </span>
        </div>
        {isLoading ? (
          <div className="flex min-h-screen w-screen max-w-[50rem] items-start justify-center pt-[20%]">
            <Spinner className="size-12 self-center justify-self-center" />
          </div>
        ) : productsList && productsList.length > 0 ? (
          <div className="mx-auto grid w-[50rem] grid-cols-3 gap-x-10 gap-y-10 max-[1150px]:w-max max-[1150px]:grid-cols-2 max-[830px]:grid-cols-2">
            {productsList.map((product, key) => (
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
          count={totalPages}
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
