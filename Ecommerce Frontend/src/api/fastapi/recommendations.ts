import apiClient from "./apiClient";

export interface ProductOrbitPoint {
  product_id: number;
  title: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  imgUrl: string | null;
  position: { x: number; y: number; z: number };
  similarity_score: number;
}

export interface OrbitViewData {
  query_text: string;
  query_position: { x: number; y: number; z: number };
  total_products: number;
  products: ProductOrbitPoint[];
  dimension_info: {
    original_dimensions: number;
    reduced_dimensions: number;
    method: string;
    centered_at_origin: boolean;
    scale_range?: string;
  };
}

export interface OrbitViewRequest {
  query_text: string;
  limit?: number;
  filters?: Record<string, any>;
}

export const recommendationsApi = {
  /**
   * Get products in 3D semantic space for orbit visualization
   */
  async getOrbitView(request: OrbitViewRequest): Promise<OrbitViewData> {
    const response = await apiClient.post<OrbitViewData>(
      "/recommendations/orbit-view",
      request,
    );
    return response.data;
  },
};
