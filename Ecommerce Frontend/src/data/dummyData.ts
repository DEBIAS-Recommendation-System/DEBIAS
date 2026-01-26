import { Product, Category, User, Cart, CartItem } from '@/types/fastapi.types';

// ============ PRODUCTS FROM CSV ============
// Note: Products are now loaded lazily in getProducts action to avoid blocking initial page load
// This prevents loading all 6,447 products at application startup

export const dummyProducts: Product[] = [];
export const dummyCategories: Category[] = [];


// ============ USERS ============
export const dummyUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    full_name: 'Admin User',
    password: 'hashed_password_admin',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    carts: [],
  },
  {
    id: 2,
    username: 'john_doe',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    password: 'hashed_password_john',
    role: 'user',
    is_active: true,
    created_at: '2024-06-15T10:30:00Z',
    carts: [],
  },
  {
    id: 3,
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    full_name: 'Jane Smith',
    password: 'hashed_password_jane',
    role: 'user',
    is_active: true,
    created_at: '2024-07-20T14:45:00Z',
    carts: [],
  },
];

// ============ CART ITEMS ============
const dummyCartItems: CartItem[] = [
  {
    id: 1,
    product_id: dummyProducts[0]?.id || 1,
    quantity: 2,
    subtotal: (dummyProducts[0]?.price || 0) * 2,
    product: dummyProducts[0],
  },
  {
    id: 2,
    product_id: dummyProducts[1]?.id || 2,
    quantity: 1,
    subtotal: dummyProducts[1]?.price || 0,
    product: dummyProducts[1],
  },
];

// ============ CARTS ============
export const dummyCarts: Cart[] = [
  {
    id: 1,
    user_id: 2,
    created_at: '2025-01-15T10:00:00Z',
    total_amount: dummyCartItems.reduce((sum, item) => sum + item.subtotal, 0),
    cart_items: dummyCartItems,
  },
];

// ============ HELPER FUNCTIONS ============

// Simulate async delay
export const delay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Get product by ID
export const getProductById = (id: number): Product | undefined => {
  return dummyProducts.find(p => p.id === id);
};

// Get products by category
export const getProductsByCategory = (categoryId: number): Product[] => {
  return dummyProducts.filter(p => p.category_id === categoryId);
};

// Search products
export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return dummyProducts.filter(
    p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery)
  );
};

// Get hub products
export const getHubProducts = (): Product[] => {
  return dummyProducts.filter(p => p.budget_hub);
};

// In-memory cart for current session
let sessionCart: CartItem[] = [...dummyCartItems];
let cartIdCounter = 4; // Start from 4 since we have 3 items

export const cartHelpers = {
  getCart: () => sessionCart,
  
  addToCart: (productId: number, quantity: number = 1) => {
    const product = getProductById(productId);
    if (!product) return sessionCart;
    
    const existingItem = sessionCart.find(item => item.product_id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * product.price;
    } else {
      sessionCart.push({
        id: cartIdCounter++,
        product_id: productId,
        quantity,
        subtotal: quantity * product.price,
        product,
      });
    }
    
    return sessionCart;
  },
  
  removeFromCart: (productId: number) => {
    sessionCart = sessionCart.filter(item => item.product_id !== productId);
    return sessionCart;
  },
  
  updateQuantity: (productId: number, quantity: number) => {
    const item = sessionCart.find(item => item.product_id === productId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = quantity * item.product.price;
    }
    return sessionCart;
  },
  
  clearCart: () => {
    sessionCart = [];
    return sessionCart;
  },
  
  getTotal: () => {
    return sessionCart.reduce((total, item) => total + item.subtotal, 0);
  },
};

// In-memory wishlist
let sessionWishlist: number[] = [];

export const wishlistHelpers = {
  getWishlist: () => sessionWishlist,
  
  addToWishlist: (productId: number) => {
    if (!sessionWishlist.includes(productId)) {
      sessionWishlist.push(productId);
    }
    return sessionWishlist;
  },
  
  removeFromWishlist: (productId: number) => {
    sessionWishlist = sessionWishlist.filter(id => id !== productId);
    return sessionWishlist;
  },
  
  isInWishlist: (productId: number) => {
    return sessionWishlist.includes(productId);
  },
};

// Current logged-in user (mock)
export let currentUser: User | null = null;

export const authHelpers = {
  getCurrentUser: () => currentUser,
  
  setCurrentUser: (user: User | null) => {
    currentUser = user;
  },
  
  login: (username: string, password: string) => {
    const user = dummyUsers.find(u => u.username === username);
    if (user) {
      currentUser = user;
      return true;
    }
    return false;
  },
  
  logout: () => {
    currentUser = null;
    sessionCart = [];
    sessionWishlist = [];
  },
  
  isAuthenticated: () => !!currentUser,
};
