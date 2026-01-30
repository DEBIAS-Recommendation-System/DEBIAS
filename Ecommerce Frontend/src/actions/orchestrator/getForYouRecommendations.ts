"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface OrchestratorRecommendation {
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

export interface ForYouResponse {
  user_id: number;
  page: number;
  page_size: number;
  has_more: boolean;
  mode: string;
  strategy: string;
  recommendations: OrchestratorRecommendation[];
}

/**
 * Get personalized "For You" recommendations for a user
 * Uses GET /orchestrator/for-you/{user_id}
 */
export async function getForYouRecommendations(
  userId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ForYouResponse | null; error: any }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    }); 

    const response = await fetch(
      `${API_URL}/orchestrator/for-you/${userId}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("For You API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch For You recommendations: ${response.statusText}`);
    }

    const result: ForYouResponse = await response.json();

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching For You recommendations:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch recommendations" },
    };
  }
}
