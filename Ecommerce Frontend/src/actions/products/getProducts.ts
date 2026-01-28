"use server";
import { Tables } from "@/types/database.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function getProducts({
  tableName,
  count = {},
  sort,
  minDiscount,
  priceRange,
  pagination,
  search,
  match,
  minStock,
}: {
  tableName: "products";
  count?: {
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
  };
  search?: { column: keyof Tables<"products">; value: string };
  sort?: {
    column: keyof Tables<"products">;
    ascending: boolean;
  };
  match?:
    | Partial<{ [k in keyof Tables<"products">]: Tables<"products">[k] }>
    | undefined;
  minDiscount?: number;
  minStock?: number;
  priceRange?: number[];
  category?: string;
  pagination?: {
    limit: number;
    page: number;
  };
}) {
  try {
    // Build query parameters for FastAPI
    const params = new URLSearchParams();

    // Add pagination (FastAPI uses page and limit, not skip)
    if (pagination) {
      params.append("page", String(pagination.page));
      params.append("limit", String(pagination.limit));
    }

    // Add search (FastAPI supports search query parameter)
    if (search?.value) {
      params.append("search", search.value);
    }

    // Add sorting (Note: FastAPI may not support this yet - will be filtered client-side)
    // if (sort) {
    //   params.append("sort_by", sort.column as string);
    //   params.append("order", sort.ascending ? "asc" : "desc");
    // }

    // Note: FastAPI backend may need additional endpoints for advanced filtering
    // For now, we'll fetch and filter client-side for compatibility

    const url = `${API_URL}/products${params.toString() ? `?${params.toString()}` : ""}`;
    
    console.log("Fetching products from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Disable caching for dynamic data
    });

    if (!response.ok) {
      console.error("FastAPI response error:", response.status, response.statusText);
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("FastAPI result:", result);
    
    // FastAPI returns { message, data, total_count }
    let products = result.data || [];
    const totalCount = result.total_count || 0; // Use the API's total count

    // Apply client-side filters that aren't supported by the API yet
    if (match) {
      products = products.filter((product: any) => {
        return Object.entries(match).every(([key, value]) => {
          return product[key] === value;
        });
      });
    }

    if (minDiscount !== undefined) {
      products = products.filter((product: any) => 
        product.discount >= minDiscount
      );
    }

    if (priceRange && priceRange.length === 2) {
      products = products.filter((product: any) => 
        product.price >= priceRange[0] && product.price <= priceRange[1]
      );
    }

    if (minStock !== undefined) {
      products = products.filter((product: any) => 
        product.stock >= minStock
      );
    }

    // If only count is requested
    if (count.head) {
      return {
        data: null,
        error: null,
        count: totalCount,
      };
    }

    return {
      data: products as Tables<"products">[] | null,
      error: null,
      count: totalCount,
    };
  } catch (error: any) {
    console.error("Error fetching products from FastAPI:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch products" },
      count: 0,
    };
  }
}
