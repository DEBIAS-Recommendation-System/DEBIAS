"use server";
import { Tables } from "@/types/database.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function getSemanticSearch({
  query,
  limit = 10,
  category,
  use_mmr = true,
  mmr_diversity = 0.5,
  score_threshold,
}: {
  query: string;
  limit?: number;
  category?: string;
  use_mmr?: boolean;
  mmr_diversity?: number;
  score_threshold?: number;
}): Promise<{
  data: Tables<"products">[] | null;
  error: any;
  scores?: Record<number, number>;
}> {
  try {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      use_mmr: String(use_mmr),
      mmr_diversity: String(mmr_diversity),
    });

    if (category) {
      params.append("category", category);
    }

    if (score_threshold !== undefined) {
      params.append("score_threshold", String(score_threshold));
    }

    const url = `${API_URL}/products/search/semantic?${params.toString()}`;

    console.log("Fetching semantic search:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Semantic search error:", response.status, response.statusText);
      throw new Error(`Failed to perform semantic search: ${response.statusText}`);
    }

    const result = await response.json();

    // Transform product_id to id and add missing fields for frontend compatibility
    const products = (result.data || []).map((product: any) => ({
      ...product,
      id: String(product.product_id), // Convert product_id to id (and ensure it's a string)
      stock: product.stock ?? 100,
      discount: product.discount ?? 0,
      discount_type: product.discount_type ?? "PERCENTAGE",
      description: product.description ?? "",
      subtitle: product.subtitle ?? "",
      category_id: product.category_id ?? 1,
      created_at: product.created_at ?? new Date().toISOString(),
      slug: product.slug ?? null,
      wholesale_price: product.wholesale_price ?? product.price,
      extra_images_urls: product.extra_images_urls ?? null,
    }));

    return {
      data: products,
      error: null,
      scores: result.scores,
    };
  } catch (error: any) {
    console.error("Error in semantic search:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to perform semantic search" },
    };
  }
}
