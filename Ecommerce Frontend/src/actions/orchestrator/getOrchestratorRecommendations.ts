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

export interface OrchestratorRecommendationsResponse {
  user_id: number;
  mode: string;
  mode_context?: any;
  total_count: number;
  sources_used: string[];
  strategy: string;
  recommendations: OrchestratorRecommendation[];
}

export interface OrchestratorRecommendationsRequest {
  user_id: number;
  product_id?: number;
  total_limit?: number;
  behavioral_weight?: number;
  trending_weight?: number;
  activity_weight?: number;
  mmr_diversity?: number;
  include_reasons?: boolean;
}

/**
 * Get orchestrated recommendations based on user behavior and optionally a product
 * Uses POST /orchestrator/recommendations
 */
export async function getOrchestratorRecommendations(
  request: OrchestratorRecommendationsRequest
): Promise<{ data: OrchestratorRecommendationsResponse | null; error: any }> {
  try {
    const response = await fetch(`${API_URL}/orchestrator/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: request.user_id,
        total_limit: request.total_limit ?? 20,
        behavioral_weight: request.behavioral_weight ?? 0.3,
        trending_weight: request.trending_weight ?? 0.2,
        activity_weight: request.activity_weight ?? 0.5,
        mmr_diversity: request.mmr_diversity ?? 0.7,
        include_reasons: request.include_reasons ?? true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Orchestrator API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const result: OrchestratorRecommendationsResponse = await response.json();

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching orchestrator recommendations:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch recommendations" },
    };
  }
}

/**
 * Get recommendations for a specific user using the simplified GET endpoint
 * Uses GET /orchestrator/recommendations/{user_id}
 */
export async function getRecommendationsByUserId(
  userId: number,
  limit: number = 20,
  includeReasons: boolean = true
): Promise<{ data: OrchestratorRecommendationsResponse | null; error: any }> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      include_reasons: String(includeReasons),
    });

    const response = await fetch(
      `${API_URL}/orchestrator/recommendations/${userId}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Orchestrator API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const result: OrchestratorRecommendationsResponse = await response.json();

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching recommendations by user ID:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch recommendations" },
    };
  }
}
