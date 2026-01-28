// FastAPI Backend Types

// ==================== BASE TYPES ====================
export interface ApiResponse<T> {
  message: string;
  data: T;
}

// ==================== AUTH TYPES ====================
export interface SignupRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  session_id: string;
  token_type: string;
  expires_in: number;
}

export interface UserBase {
  id: number;
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: string;
  carts: CartBase[];
}

// ==================== PRODUCT TYPES ====================
export interface ProductBase {
  product_id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  imgUrl: string;
}

export interface ProductCreate extends ProductBase {}

export interface ProductUpdate {
  title?: string;
  brand?: string;
  category?: string;
  price?: number;
  imgUrl?: string;
}

export type ProductResponse = ApiResponse<ProductBase>;
export type ProductsResponse = ApiResponse<ProductBase[]>;

// ==================== CATEGORY TYPES ====================
export interface CategoryBase {
  id: number;
  name: string;
}

export interface CategoryCreate {
  name: string;
}

export interface CategoryUpdate {
  name: string;
}

export type CategoryResponse = ApiResponse<CategoryBase>;
export type CategoriesResponse = ApiResponse<CategoryBase[]>;

// ==================== CART TYPES ====================
export interface ProductBaseCart extends ProductBase {}

export interface CartItemBase {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: ProductBaseCart;
}

export interface CartBase {
  id: number;
  user_id: number;
  created_at: string;
  total_amount: number;
  cart_items: CartItemBase[];
}

export interface CartItemCreate {
  product_id: number;
  quantity: number;
}

export interface CartCreate {
  cart_items: CartItemCreate[];
}

export interface CartUpdate extends CartCreate {}

export type CartResponse = ApiResponse<CartBase>;
export type CartsResponse = ApiResponse<CartBase[]>;

// ==================== USER TYPES ====================
export interface UserCreate {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface UserUpdate extends UserCreate {}

export type UserResponse = ApiResponse<UserBase>;
export type UsersResponse = ApiResponse<UserBase[]>;

// ==================== ACCOUNT TYPES ====================
export interface AccountBase {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  carts: CartBase[];
}

export interface AccountUpdate {
  username: string;
  email: string;
  full_name: string;
}

export type AccountResponse = ApiResponse<AccountBase>;

// ==================== EVENT TYPES ====================
export interface EventBase {
  id: number;
  event_time: string;
  event_type: "purchase" | "cart" | "view";
  product_id: number;
  user_id: number | null;
  user_session: string;
}

export interface EventCreate {
  event_time?: string;
  event_type: "purchase" | "cart" | "view";
  product_id: number;
  user_id?: number;
  user_session: string;
}

export type EventResponse = ApiResponse<EventBase>;
export type EventsResponse = ApiResponse<EventBase[]>;

// ==================== QUERY PARAMS ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserQueryParams extends PaginationParams {
  role?: "user" | "admin";
}
