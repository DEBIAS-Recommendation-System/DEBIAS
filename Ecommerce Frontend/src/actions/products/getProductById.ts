"use server";
import { Tables } from "@/types/database.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function getProductById(
  productId: string | number
): Promise<{ data: Tables<"products"> | null; error: any }> {
  try {
    const url = `${API_URL}/products/${productId}`;
    
    console.log("Fetching product by ID:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("FastAPI response error:", response.status, response.statusText);
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Transform product_id to id and add missing fields for frontend compatibility
    const product = result.data ? {
      ...result.data,
      id: String(result.data.product_id), // Convert product_id to id (and ensure it's a string)
      stock: result.data.stock ?? 100,
      discount: result.data.discount ?? 0,
      discount_type: result.data.discount_type ?? "PERCENTAGE",
      description: result.data.description ?? "",
      subtitle: result.data.subtitle ?? "",
      category_id: result.data.category_id ?? 1,
      created_at: result.data.created_at ?? new Date().toISOString(),
      slug: result.data.slug ?? null,
      wholesale_price: result.data.wholesale_price ?? result.data.price,
      extra_images_urls: result.data.extra_images_urls ?? null,
    } : null;
    
    return {
      data: product,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching product by ID:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch product" },
    };
  }
}
