import { match } from "assert";
import { infinityPagination } from "@/helpers/infinityPagination";
import { Tables } from "@/types/database.types";
import getProducts from "@/actions/products/getProducts";

export interface ProductsQueryType {
  page: number;
  limit: number;
  search?: { column: keyof Tables<"products">; value: string };
  sort?: {
    ascending: boolean;
    column: keyof Tables<"products">;
  };
  filters?: {
    minDiscount?: number;
    priceRange?: number[];
    minStock?: number;
  };
  match?:
    | Partial<{ [k in keyof Tables<"products">]: Tables<"products">[k] }>
    | undefined;
}

const productsQuery = (args: ProductsQueryType) => ({
  queryKey: [
    "products",
    {
      ...args,
    },
  ],
  queryFn: async () => {
    // Single call - get both data and count from one request
    const data = await getProducts({
      tableName: "products",
      count: { count: "exact" },
      ...args,
      match: args.match,
      minDiscount: args.filters?.minDiscount,
      priceRange: args.filters?.priceRange,
      minStock: args.filters?.minStock,
      pagination: {
        page: args.page,
        limit: args.limit,
      },
    });
    
    return {
      ...infinityPagination(data?.data ?? [], {
        page: args.page,
        limit: args.limit,
        total_count: data.count ?? 0,
      }),
      error: data.error,
    };
  },
});

export { productsQuery };
