"use server";
import { RecommendationRequest, RecommendationResponse } from "@/types/fastapi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function getRecommendations(
  request: RecommendationRequest
): Promise<{ data: RecommendationResponse | null; error: any }> {
  try {
    const response = await fetch(`${API_URL}/recommendations/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      cache: "no-store", // Disable caching for dynamic data
    });

    if (!response.ok) {
      console.error("Recommendations API error:", response.status, response.statusText);
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const result: RecommendationResponse = await response.json();
    
    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching recommendations:", error);
    return {
      data: null,
      error: { message: error.message || "Failed to fetch recommendations" },
    };
  }
}
