"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ComplementaryRecommendation {
  product_id: number;
  score: number;
  source: string;
  reason?: string;
  payload?: {
    title?: string;
    brand?: string;
    category?: string;
    price?: number;
    imgUrl?: string;
    image_url?: string;
    description?: string;
  };
}

export interface ComplementaryResponse {
  user_id: number;
  purchased_product_id: number;
  total_count: number;
  recommendations: ComplementaryRecommendation[];
}

export interface ComplementaryRequest {
  user_id: number;
  purchased_product_id: number;
  limit?: number;
}

/**
 * Get complementary products after a purchase
 * Uses POST /orchestrator/complementary
 */
export async function getComplementaryProducts(
  request: ComplementaryRequest
): Promise<{ data: ComplementaryResponse | null; error: any }> {
  try {
    const response = await fetch(`${API_URL}/orchestrator/complementary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: request.user_id,
        purchased_product_id: request.purchased_product_id,
        limit: request.limit ?? 10,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Complementary API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch complementary products: ${response.statusText}`);
    }

    const result: ComplementaryResponse = await response.json();

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching complementary products:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch complementary products" },
    };
  }
}
