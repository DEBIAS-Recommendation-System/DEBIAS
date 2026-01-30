"use server";
import { Tables } from "@/types/database.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Fetch products by their IDs from the FastAPI backend
 */
export default async function getProductsByIds(
  productIds: number[]
): Promise<{ data: Tables<"products">[] | null; error: any }> {
  try {
    if (!productIds || productIds.length === 0) {
      return { data: [], error: null };
    }

    // Build query parameters with product_ids
    const params = new URLSearchParams();
    productIds.forEach(id => params.append("product_ids", id.toString()));

    const url = `${API_URL}/products/by-ids?${params.toString()}`;
    
    console.log("Fetching products by IDs:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("FastAPI response error:", response.status, response.statusText);
      throw new Error(`Failed to fetch products by IDs: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      data: result.data || [],
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching products by IDs:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch products by IDs" },
    };
  }
}
