// FastAPI Response Types matching the backend schemas

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  discount_percentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
  is_published: boolean;
  created_at: string;
  category_id: number;
  category: Category;
  // DEBIAS specific fields
  price_percentile?: number;  // 0.0 to 1.0
  budget_hub?: boolean;       // Popular hub product
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  carts: Cart[];
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  created_at: string;
  total_amount: number;
  cart_items: CartItem[];
}

// API Response Wrappers
export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiListResponse<T> {
  message: string;
  data: T[];
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Product Create/Update
export interface ProductCreate {
  title: string;
  description: string | null;
  price: number;
  discount_percentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
  is_published: boolean;
  category_id: number;
  created_at: string;
}

export interface ProductUpdate extends Partial<ProductCreate> {}

// Cart Create/Update
export interface CartItemCreate {
  product_id: number;
  quantity: number;
}

export interface CartCreate {
  cart_items: CartItemCreate[];
}

export interface CartUpdate extends CartCreate {}

// Search/Filter Types
export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: 'price' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// DEBIAS Specific Types
export interface DebiasSearchParams {
  query: string;          // Text search query
  budget?: number;        // User's budget constraint
  category_id?: number;   // Optional category filter
  limit?: number;
}

export type PriceTier = 'budget' | 'value' | 'mid' | 'premium' | 'luxury';

export interface ProductBadge {
  label: string;
  type: 'value' | 'premium' | 'hub';
  color: string;
}
