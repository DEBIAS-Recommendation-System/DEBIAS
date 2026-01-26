import { Product, Category, User, Cart, CartItem } from '@/types/fastapi.types';

// ============ CATEGORIES ============
export const dummyCategories: Category[] = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Clothing' },
  { id: 3, name: 'Home & Kitchen' },
  { id: 4, name: 'Books' },
  { id: 5, name: 'Sports & Outdoors' },
  { id: 6, name: 'Beauty & Personal Care' },
  { id: 7, name: 'Toys & Games' },
  { id: 8, name: 'Automotive' },
];

// ============ PRODUCTS ============
export const dummyProducts: Product[] = [
  {
    id: 1,
    title: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life',
    price: 299.99,
    discount_percentage: 15,
    rating: 4.5,
    stock: 45,
    brand: 'TechSound',
    thumbnail: '/home/products/product1.jpg',
    images: ['/home/products/product1.jpg', '/home/products/product1-2.jpg'],
    is_published: true,
    created_at: '2025-01-01T10:00:00Z',
    category_id: 1,
    category: dummyCategories[0],
    price_percentile: 0.75,
    budget_hub: true,
  },
  {
    id: 2,
    title: 'Smart Watch Series 5',
    description: 'Advanced fitness tracking, heart rate monitoring, GPS, and waterproof design',
    price: 399.99,
    discount_percentage: 10,
    rating: 4.7,
    stock: 120,
    brand: 'TechTime',
    thumbnail: '/home/products/product2.jpg',
    images: ['/home/products/product2.jpg'],
    is_published: true,
    created_at: '2025-01-02T10:00:00Z',
    category_id: 1,
    category: dummyCategories[0],
    price_percentile: 0.85,
    budget_hub: false,
  },
  {
    id: 3,
    title: 'Organic Cotton T-Shirt',
    description: 'Comfortable, breathable organic cotton t-shirt available in multiple colors',
    price: 24.99,
    discount_percentage: 20,
    rating: 4.3,
    stock: 200,
    brand: 'EcoWear',
    thumbnail: '/home/products/product3.jpg',
    images: ['/home/products/product3.jpg', '/home/products/product3-2.jpg'],
    is_published: true,
    created_at: '2025-01-03T10:00:00Z',
    category_id: 2,
    category: dummyCategories[1],
    price_percentile: 0.35,
    budget_hub: true,
  },
  {
    id: 4,
    title: 'Stainless Steel Coffee Maker',
    description: 'Programmable 12-cup coffee maker with thermal carafe and auto-brew function',
    price: 89.99,
    discount_percentage: 25,
    rating: 4.4,
    stock: 65,
    brand: 'BrewMaster',
    thumbnail: '/home/products/product4.jpg',
    images: ['/home/products/product4.jpg'],
    is_published: true,
    created_at: '2025-01-04T10:00:00Z',
    category_id: 3,
    category: dummyCategories[2],
    price_percentile: 0.50,
    budget_hub: true,
  },
  {
    id: 5,
    title: 'The Art of Programming',
    description: 'Comprehensive guide to software development best practices and design patterns',
    price: 49.99,
    discount_percentage: 0,
    rating: 4.8,
    stock: 150,
    brand: 'TechPress',
    thumbnail: '/home/products/product5.jpg',
    images: ['/home/products/product5.jpg'],
    is_published: true,
    created_at: '2025-01-05T10:00:00Z',
    category_id: 4,
    category: dummyCategories[3],
    price_percentile: 0.60,
    budget_hub: false,
  },
  {
    id: 6,
    title: 'Yoga Mat with Carrying Strap',
    description: 'Non-slip, eco-friendly yoga mat with extra cushioning for comfort',
    price: 34.99,
    discount_percentage: 15,
    rating: 4.6,
    stock: 85,
    brand: 'FitLife',
    thumbnail: '/home/products/product6.jpg',
    images: ['/home/products/product6.jpg', '/home/products/product6-2.jpg'],
    is_published: true,
    created_at: '2025-01-06T10:00:00Z',
    category_id: 5,
    category: dummyCategories[4],
    price_percentile: 0.40,
    budget_hub: true,
  },
  {
    id: 7,
    title: 'Moisturizing Face Cream',
    description: 'Hydrating face cream with SPF 30, suitable for all skin types',
    price: 28.99,
    discount_percentage: 10,
    rating: 4.5,
    stock: 110,
    brand: 'GlowSkin',
    thumbnail: '/home/products/product7.jpg',
    images: ['/home/products/product7.jpg'],
    is_published: true,
    created_at: '2025-01-07T10:00:00Z',
    category_id: 6,
    category: dummyCategories[5],
    price_percentile: 0.45,
    budget_hub: false,
  },
  {
    id: 8,
    title: 'Board Game - Strategy Quest',
    description: 'Exciting strategy board game for 2-6 players, ages 12 and up',
    price: 39.99,
    discount_percentage: 5,
    rating: 4.7,
    stock: 75,
    brand: 'GameNight',
    thumbnail: '/home/products/product8.jpg',
    images: ['/home/products/product8.jpg'],
    is_published: true,
    created_at: '2025-01-08T10:00:00Z',
    category_id: 7,
    category: dummyCategories[6],
    price_percentile: 0.55,
    budget_hub: false,
  },
  {
    id: 9,
    title: 'Car Phone Mount',
    description: 'Universal smartphone car mount with 360-degree rotation and strong grip',
    price: 19.99,
    discount_percentage: 20,
    rating: 4.4,
    stock: 95,
    brand: 'DriveEasy',
    thumbnail: '/home/products/product9.jpg',
    images: ['/home/products/product9.jpg'],
    is_published: true,
    created_at: '2025-01-09T10:00:00Z',
    category_id: 8,
    category: dummyCategories[7],
    price_percentile: 0.25,
    budget_hub: true,
  },
  {
    id: 10,
    title: '4K Ultra HD Smart TV',
    description: '55-inch 4K Smart TV with HDR, built-in streaming apps, and voice control',
    price: 549.99,
    discount_percentage: 12,
    rating: 4.6,
    stock: 30,
    brand: 'VisionTech',
    thumbnail: '/home/products/product10.jpg',
    images: ['/home/products/product10.jpg', '/home/products/product10-2.jpg'],
    is_published: true,
    created_at: '2025-01-10T10:00:00Z',
    category_id: 1,
    category: dummyCategories[0],
    price_percentile: 0.90,
    budget_hub: false,
  },
  {
    id: 11,
    title: 'Running Shoes - Pro Edition',
    description: 'Lightweight running shoes with advanced cushioning and breathable mesh',
    price: 119.99,
    discount_percentage: 18,
    rating: 4.8,
    stock: 140,
    brand: 'SportRun',
    thumbnail: '/home/products/product11.jpg',
    images: ['/home/products/product11.jpg'],
    is_published: true,
    created_at: '2025-01-11T10:00:00Z',
    category_id: 5,
    category: dummyCategories[4],
    price_percentile: 0.65,
    budget_hub: true,
  },
  {
    id: 12,
    title: 'Blender Pro 5000',
    description: 'High-powered blender with multiple speed settings and durable steel blades',
    price: 79.99,
    discount_percentage: 22,
    rating: 4.5,
    stock: 55,
    brand: 'KitchenPro',
    thumbnail: '/home/products/product12.jpg',
    images: ['/home/products/product12.jpg'],
    is_published: true,
    created_at: '2025-01-12T10:00:00Z',
    category_id: 3,
    category: dummyCategories[2],
    price_percentile: 0.48,
    budget_hub: true,
  },
];

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
    product_id: 1,
    quantity: 2,
    subtotal: 599.98,
    product: dummyProducts[0],
  },
  {
    id: 2,
    product_id: 3,
    quantity: 3,
    subtotal: 74.97,
    product: dummyProducts[2],
  },
  {
    id: 3,
    product_id: 6,
    quantity: 1,
    subtotal: 34.99,
    product: dummyProducts[5],
  },
];

// ============ CARTS ============
export const dummyCarts: Cart[] = [
  {
    id: 1,
    user_id: 2,
    created_at: '2025-01-15T10:00:00Z',
    total_amount: 709.94,
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
