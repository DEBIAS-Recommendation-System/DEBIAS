# Complete Step-by-Step Guide: Building the DEBIAS E-commerce Platform

This guide walks you through building a full-featured e-commerce platform with Next.js 14, from initial setup to deployment.

---

## Table of Contents
1. [Initial Setup](#1-initial-setup)
2. [Project Structure](#2-project-structure)
3. [Database & Authentication](#3-database--authentication)
4. [Styling & UI Components](#4-styling--ui-components)
5. [Product Catalog System](#5-product-catalog-system)
6. [Home Screen & Landing Page](#6-home-screen--landing-page)
7. [Product Filtering & Search](#7-product-filtering--search)
8. [Shopping Cart Management](#8-shopping-cart-management)
9. [Order Management](#9-order-management)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [Admin Dashboard](#11-admin-dashboard)
12. [Payment Integration](#12-payment-integration)
13. [Real-time Features](#13-real-time-features)
14. [CSV Product Integration](#14-csv-product-integration)
15. [Optimization & Deployment](#15-optimization--deployment)

---

## 1. Initial Setup

### Step 1.1: Create Next.js Project
```bash
npx create-next-app@14 ecommerce-platform
cd ecommerce-platform
```

**Configuration choices:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ✅ `src/` directory
- ❌ Turbopack (optional)

### Step 1.2: Install Core Dependencies
```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add zod
pnpm add classnames
pnpm add react-icons
```

### Step 1.3: Install UI Libraries
```bash
pnpm add daisyui
pnpm add @mui/material @mui/icons-material @emotion/react @emotion/styled
pnpm add @lottiefiles/react-lottie-player
pnpm add swiper
pnpm add react-hot-toast
```

### Step 1.4: Setup Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 2. Project Structure

### Step 2.1: Create Directory Structure
```
src/
├── actions/          # Server actions
│   ├── auth/
│   ├── Cart/
│   ├── Order/
│   ├── products/
│   └── wishlist/
├── api/              # API utilities
│   ├── getData.ts
│   ├── postData.ts
│   ├── updateData.ts
│   └── deleteData.ts
├── app/              # App router pages
│   ├── (auth)/       # Auth group
│   ├── (dashboard)/  # User dashboard
│   ├── (adminDashboard)/ # Admin pages
│   ├── layout.tsx
│   └── page.tsx
├── components/       # Reusable components
│   ├── ui/
│   ├── auth/
│   ├── icons/
│   └── search/
├── constants/        # Configuration constants
├── data/             # Static/generated data
├── helpers/          # Utility functions
├── hooks/            # Custom React hooks
├── lib/              # External library configs
├── provider/         # Context providers
├── translation/      # i18n files
├── types/            # TypeScript types
└── utils/            # Utility functions
```

### Step 2.2: Configure Path Aliases
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 3. Database & Authentication

### Step 3.1: Setup Supabase
1. Create a Supabase project at https://supabase.com
2. Generate TypeScript types:
```bash
pnpm add -D supabase
npx supabase login
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

### Step 3.2: Create Database Schema
Execute SQL in Supabase:
```sql
-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  brand TEXT,
  thumbnail TEXT,
  images TEXT[],
  is_published BOOLEAN DEFAULT true,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carts table
CREATE TABLE public.carts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart items table
CREATE TABLE public.cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  subtotal DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  total_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE public.wishlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  product_id INTEGER REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Step 3.3: Create Supabase Client
`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

### Step 3.4: Authentication System

Create auth actions in `src/actions/auth/`:

**`signup.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/login');
}
```

**`login.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}
```

**`logout.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

### Step 3.5: Create Auth Pages

**`src/app/(auth)/login/page.tsx`:**
```typescript
import { login } from '@/actions/auth/login';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={login} className="w-full max-w-md space-y-4 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold">Login</h1>
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
```

---

## 4. Styling & UI Components

### Step 4.1: Configure Tailwind & DaisyUI
Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
  },
};

export default config;
```

### Step 4.2: Create Reusable Button Components

**`src/components/PrimaryButton.tsx`:**
```typescript
'use client';
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export default function PrimaryButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
```

**`src/components/Input.tsx`:**
```typescript
'use client';
import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
}

export default function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  className = '',
  name
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
    />
  );
}
```

### Step 4.3: Create Dropdown Component

**`src/components/dropDown.tsx`:**
```typescript
'use client';
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

interface DropdownProps<T> {
  options: { value: T; label: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
  className?: string;
}

export default function Dropdown<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer px-4 py-2 border rounded-lg flex items-center justify-between ${className}`}
      >
        <span>{selectedOption?.label}</span>
        {isOpen ? <FaArrowUp /> : <FaArrowDown />}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg">
          {options.map((option) => (
            <li
              key={String(option.value)}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 5. Product Catalog System

### Step 5.1: Create Type Definitions

**`src/types/fastapi.types.ts`:**
```typescript
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
  price_percentile?: number;
  budget_hub?: boolean;
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
  user_id: string;
  created_at: string;
  total_amount: number;
  cart_items: CartItem[];
}

export interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  created_at: string;
}
```

### Step 5.2: Create API Utilities

**`src/api/getData.ts`:**
```typescript
import { createClient } from '@/lib/supabase/client';

export async function getProducts(filters?: {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_published', true);

  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getProductById(id: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCategories() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) throw error;
  return data;
}
```

### Step 5.3: Setup React Query

**`src/provider/QueryProvider.tsx`:**
```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Update `src/app/layout.tsx`:
```typescript
import QueryProvider from '@/provider/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Step 5.4: Create Product Hooks

**`src/hooks/useProductsQuery.ts`:**
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/getData';

export function useProductsQuery(filters?: any) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
  });
}
```

---

## 6. Home Screen & Landing Page

### Step 6.1: Install Swiper
```bash
pnpm add swiper
```

### Step 6.2: Create Home Swiper Component

**`src/app/(dashboard)/ui/home/ui/HomeSwiper.tsx`:**
```typescript
'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const banners = [
  { id: 1, image: '/home/banners/banner1.jpg', alt: 'Banner 1' },
  { id: 2, image: '/home/banners/banner2.jpg', alt: 'Banner 2' },
  { id: 3, image: '/home/banners/banner3.jpg', alt: 'Banner 3' },
];

export default function HomeSwiper() {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={0}
      slidesPerView={1}
      autoplay={{ delay: 5000 }}
      pagination={{ clickable: true }}
      navigation
      className="w-full h-[400px]"
    >
      {banners.map((banner) => (
        <SwiperSlide key={banner.id}>
          <Image
            src={banner.image}
            alt={banner.alt}
            fill
            className="object-cover"
            priority={banner.id === 1}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
```

### Step 6.3: Create Product Card Component

**`src/components/ui/ProductCard.tsx`:**
```typescript
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/fastapi.types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="relative h-48 mb-4">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-contain"
          />
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {product.discount_percentage > 0 && (
            <span className="text-sm text-red-500">
              -{product.discount_percentage}%
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          <span className="text-yellow-500">★</span>
          <span className="text-sm">{product.rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
```

### Step 6.4: Create Products Section

**`src/app/(dashboard)/ui/home/ui/ProductsSection/ProductsSection.tsx`:**
```typescript
'use client';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import ProductCard from '@/components/ui/ProductCard';

export function ProductsSection() {
  const { data: products, isLoading } = useProductsQuery({ limit: 12 });

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

### Step 6.5: Create Home Page

**`src/app/(dashboard)/page.tsx`:**
```typescript
import HomeSwiper from './ui/home/ui/HomeSwiper';
import { ProductsSection } from './ui/home/ui/ProductsSection/ProductsSection';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeSwiper />
      <ProductsSection />
    </div>
  );
}
```

---

## 7. Product Filtering & Search

### Step 7.1: Create Filter Components

**`src/app/(dashboard)/products/ui/PriceRangeFilter.tsx`:**
```typescript
'use client';
import { useState, useEffect } from 'react';

interface PriceRangeFilterProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceRangeFilter({ min, max, onChange }: PriceRangeFilterProps) {
  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(minPrice, maxPrice);
    }, 500);

    return () => clearTimeout(timeout);
  }, [minPrice, maxPrice]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Price Range</h3>
      
      <div className="flex gap-4">
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => setMinPrice(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
        
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <input
        type="range"
        min={0}
        max={1000}
        value={maxPrice}
        onChange={(e) => setMaxPrice(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
```

**`src/app/(dashboard)/products/ui/CategoryFilter.tsx`:**
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/getData';

interface CategoryFilterProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange 
}: CategoryFilterProps) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Categories</h3>
      
      <button
        onClick={() => onCategoryChange(null)}
        className={`block w-full text-left px-3 py-2 rounded ${
          selectedCategory === null ? 'bg-primary text-white' : 'hover:bg-gray-100'
        }`}
      >
        All Categories
      </button>
      
      {categories?.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`block w-full text-left px-3 py-2 rounded ${
            selectedCategory === category.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
```

### Step 7.2: Create Search Bar

**`src/app/(dashboard)/ui/Nav/SearchBar.tsx`:**
```typescript
'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    router.push(`/products?${params.toString()}`);
  }, [search, searchParams, router]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
      <FaSearch className="text-gray-400" />
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="flex-1 outline-none"
      />
    </div>
  );
}
```

### Step 7.3: Create Products Page with Filters

**`src/app/(dashboard)/products/ui/Content.tsx`:**
```typescript
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import ProductCard from '@/components/ui/ProductCard';
import CategoryFilter from './CategoryFilter';
import PriceRangeFilter from './PriceRangeFilter';

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  const filters = {
    category: selectedCategory || undefined,
    minPrice,
    maxPrice,
    search: searchParams.get('search') || undefined,
  };

  const { data: products, isLoading } = useProductsQuery(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          
          <PriceRangeFilter
            min={minPrice}
            max={maxPrice}
            onChange={(min, max) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
          />
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## 8. Shopping Cart Management

### Step 8.1: Create Cart Actions

**`src/actions/Cart/addToCart.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addToCart(productId: number, quantity: number = 1) {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get or create cart
  let { data: cart } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!cart) {
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select()
      .single();
    cart = newCart;
  }

  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    // Update quantity
    await supabase
      .from('cart_items')
      .update({
        quantity: existingItem.quantity + quantity,
        subtotal: (existingItem.quantity + quantity) * product.price,
      })
      .eq('id', existingItem.id);
  } else {
    // Add new item
    await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        subtotal: quantity * product.price,
      });
  }

  // Update cart total
  const { data: items } = await supabase
    .from('cart_items')
    .select('subtotal')
    .eq('cart_id', cart.id);

  const total = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

  await supabase
    .from('carts')
    .update({ total_amount: total })
    .eq('id', cart.id);

  revalidatePath('/Cart');
  return { success: true };
}
```

**`src/actions/Cart/removeFromCart.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function removeFromCart(cartItemId: number) {
  const supabase = createClient();
  
  await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  revalidatePath('/Cart');
  return { success: true };
}
```

### Step 8.2: Create Cart Hook

**`src/hooks/useCartQuery.ts`:**
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useCartQuery() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
            product:products (*)
          )
        `)
        .eq('user_id', user.id)
        .single();

      return data;
    },
  });
}
```

### Step 8.3: Create Cart Page

**`src/app/(dashboard)/Cart/page.tsx`:**
```typescript
'use client';
import { useCartQuery } from '@/hooks/useCartQuery';
import { removeFromCart } from '@/actions/Cart/removeFromCart';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { data: cart, isLoading } = useCartQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!cart || !cart.cart_items?.length) {
    return <div className="text-center py-20">Your cart is empty</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.cart_items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
              <div className="relative w-24 h-24">
                <Image
                  src={item.product.thumbnail}
                  alt={item.product.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{item.product.title}</h3>
                <p className="text-gray-600">${item.product.price}</p>
                <p className="text-sm">Quantity: {item.quantity}</p>
              </div>

              <div className="text-right">
                <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 text-sm mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cart.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>${cart.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/Cart/Payment"
              className="block w-full bg-primary text-white text-center py-3 rounded-lg"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Order Management

### Step 9.1: Create Order Actions

**`src/actions/Order/createOrder.ts`:**
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createOrder(formData: FormData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get cart
  const { data: cart } = await supabase
    .from('carts')
    .select('*, cart_items(*)')
    .eq('user_id', user.id)
    .single();

  if (!cart || !cart.cart_items?.length) {
    throw new Error('Cart is empty');
  }

  // Create order
  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: cart.total_amount,
      status: 'pending',
      shipping_address: {
        name: formData.get('name'),
        address: formData.get('address'),
        city: formData.get('city'),
        zip: formData.get('zip'),
      },
    })
    .select()
    .single();

  // Create order items
  const orderItems = cart.cart_items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.subtotal / item.quantity,
  }));

  await supabase.from('order_items').insert(orderItems);

  // Clear cart
  await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  await supabase.from('carts').update({ total_amount: 0 }).eq('id', cart.id);

  redirect(`/Orders/${order.id}`);
}
```

### Step 9.2: Create Orders Page

**`src/app/(dashboard)/Orders/page.tsx`:**
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/Orders/${order.id}`}
            className="block border rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Order #{order.id}</p>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">${order.total_amount.toFixed(2)}</p>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. Internationalization (i18n)

### Step 10.1: Install i18n Package
```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

### Step 10.2: Create Translation Files

**`src/translation/en.json`:**
```json
{
  "common": {
    "home": "Home",
    "products": "Products",
    "cart": "Cart",
    "orders": "Orders",
    "login": "Login",
    "logout": "Logout",
    "search": "Search"
  },
  "product": {
    "addToCart": "Add to Cart",
    "price": "Price",
    "inStock": "In Stock",
    "outOfStock": "Out of Stock"
  },
  "cart": {
    "emptyCart": "Your cart is empty",
    "total": "Total",
    "checkout": "Proceed to Checkout"
  }
}
```

**`src/translation/fr.json`:**
```json
{
  "common": {
    "home": "Accueil",
    "products": "Produits",
    "cart": "Panier",
    "orders": "Commandes",
    "login": "Connexion",
    "logout": "Déconnexion",
    "search": "Rechercher"
  },
  "product": {
    "addToCart": "Ajouter au panier",
    "price": "Prix",
    "inStock": "En stock",
    "outOfStock": "Rupture de stock"
  },
  "cart": {
    "emptyCart": "Votre panier est vide",
    "total": "Total",
    "checkout": "Passer au paiement"
  }
}
```

### Step 10.3: Configure i18n

**`src/lib/i18n.ts`:**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/translation/en.json';
import fr from '@/translation/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Step 10.4: Create Translation Provider

**`src/provider/TranslationProvider.tsx`:**
```typescript
'use client';
import { useEffect } from 'react';
import i18n from '@/lib/i18n';

export default function TranslationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize i18n
    i18n.init();
  }, []);

  return <>{children}</>;
}
```

### Step 10.5: Use Translations

```typescript
'use client';
import { useTranslation } from 'react-i18next';

export default function Component() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.home')}</h1>
      <button onClick={() => i18n.changeLanguage('fr')}>
        Français
      </button>
    </div>
  );
}
```

---

## 11. Admin Dashboard

### Step 11.1: Create Admin Layout

**`src/app/(adminDashboard)/layout.tsx`:**
```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from './ui/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

### Step 11.2: Create Product Management

**`src/app/(adminDashboard)/myProducts/page.tsx`:**
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link
          href="/addProduct"
          className="bg-primary text-white px-6 py-2 rounded-lg"
        >
          Add Product
        </Link>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-4 text-left">Product</th>
            <th className="p-4 text-left">Price</th>
            <th className="p-4 text-left">Stock</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((product) => (
            <tr key={product.id} className="border-b">
              <td className="p-4">{product.title}</td>
              <td className="p-4">${product.price}</td>
              <td className="p-4">{product.stock}</td>
              <td className="p-4">
                <Link
                  href={`/editProduct/${product.id}`}
                  className="text-blue-500"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 12. Payment Integration

### Step 12.1: Install Stripe (Example)
```bash
pnpm add @stripe/stripe-js stripe
```

### Step 12.2: Create Payment Page

**`src/app/(dashboard)/Cart/Payment/page.tsx`:**
```typescript
'use client';
import { useState } from 'react';
import { createOrder } from '@/actions/Order/createOrder';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    await createOrder(formData);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Address</label>
          <input
            type="text"
            name="address"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">City</label>
            <input
              type="text"
              name="city"
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">ZIP Code</label>
            <input
              type="text"
              name="zip"
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
```

---

## 13. Real-time Features

### Step 13.1: Create Real-time Hook

**`src/hooks/useRealTime.ts`:**
```typescript
'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useRealTimeOrders() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}
```

---

## 14. CSV Product Integration

### Step 14.1: Create CSV Parser Script

**`scripts/generateProducts.js`:**
```javascript
const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '..', 'src', 'data', 'optimized_matches_quadratic.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

const products = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);

  // Extract only needed fields
  const product = {
    product_id: values[headers.indexOf('product_id')],
    title: values[headers.indexOf('title')],
    imgUrl: values[headers.indexOf('imgUrl')],
    brand: values[headers.indexOf('brand')],
    price_dec: parseFloat(values[headers.indexOf('price_dec')]) || 0,
    category_code: values[headers.indexOf('category_code')],
  };

  products.push(product);
}

// Generate TypeScript file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'products.generated.ts');
const tsContent = `// Auto-generated from CSV file - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

export interface Product {
  product_id: string;
  title: string;
  imgUrl: string;
  brand: string;
  price_dec: number;
  category_code: string;
}

export const products: Product[] = ${JSON.stringify(products, null, 2)};

// Console log first 10 image URLs from CSV products (browser only)
if (typeof window !== 'undefined') {
  console.log('First 10 product image URLs from CSV:');
  products.slice(0, 10).forEach((product, index) => {
    console.log(\`\${index + 1}. \${product.title}: \${product.imgUrl}\`);
  });
}
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`✅ Generated ${products.length} products from CSV`);
```

### Step 14.2: Run Generator
```bash
node scripts/generateProducts.js
```

### Step 14.3: Use Generated Products

**`src/data/dummyData.ts`:**
```typescript
import { products as csvProducts } from './products.generated';
import { Product } from '@/types/fastapi.types';

export const dummyProducts: Product[] = csvProducts.map((csvProduct, index) => {
  const productId = parseInt(csvProduct.product_id) || index + 1;
  
  return {
    id: productId,
    title: csvProduct.title || 'Untitled Product',
    description: `${csvProduct.brand} - ${csvProduct.category_code}`,
    price: csvProduct.price_dec,
    discount_percentage: 0,
    rating: 4.0,
    stock: 100,
    brand: csvProduct.brand || 'Unknown',
    thumbnail: csvProduct.imgUrl || '/fallback.jpg',
    images: [csvProduct.imgUrl],
    is_published: true,
    created_at: new Date().toISOString(),
    category_id: productId,
    category: {
      id: productId,
      name: csvProduct.category_code?.split('.')[0] || 'General',
    },
  };
});
```

---

## 15. Optimization & Deployment

### Step 15.1: Configure Next.js

**`next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'your-supabase-url.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
```

### Step 15.2: Environment Setup for Production

Create `.env.production`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Step 15.3: Build & Deploy

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# Deploy to Vercel
vercel --prod
```

### Step 15.4: Performance Optimizations

1. **Image Optimization**: Use Next.js `<Image>` component everywhere
2. **Code Splitting**: Use dynamic imports for heavy components
3. **Caching**: Configure React Query stale times appropriately
4. **Database Indexes**: Add indexes on frequently queried columns
5. **CDN**: Serve static assets from CDN

---

## Additional Features to Consider

### 1. **Product Reviews**
- Add reviews table
- Rating system
- Review moderation

### 2. **Wishlist**
- Save products for later
- Share wishlist

### 3. **Email Notifications**
- Order confirmations
- Shipping updates
- Password reset

### 4. **Analytics**
```bash
pnpm add @vercel/analytics
```

### 5. **Error Tracking**
```bash
pnpm add @sentry/nextjs
```

### 6. **SEO**
- Add metadata to pages
- Generate sitemap
- robots.txt

---

## Development Workflow

### Daily Development
```bash
# Start development server
pnpm dev

# Run type checking
pnpm tsc --noEmit

# Run linting
pnpm lint

# Format code
pnpm prettier --write .
```

### Testing (Optional)
```bash
# Install testing libraries
pnpm add -D @testing-library/react @testing-library/jest-dom jest

# Run tests
pnpm test
```

---

## Key Learnings & Best Practices

1. **Server Components First**: Use server components by default, client components only when needed
2. **Data Fetching**: Use React Query for client-side, native fetch for server
3. **Type Safety**: Define all types properly with TypeScript
4. **Error Handling**: Always handle errors gracefully
5. **Loading States**: Show loading indicators for better UX
6. **Mobile First**: Design for mobile, enhance for desktop
7. **Accessibility**: Use semantic HTML and ARIA labels
8. **Security**: Never expose sensitive keys, validate all inputs
9. **Performance**: Optimize images, lazy load components
10. **Documentation**: Comment complex logic, keep README updated

---

## Troubleshooting Common Issues

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Check for missing dependencies
- Verify environment variables

### Database Issues
- Check Supabase connection
- Verify Row Level Security policies
- Check table permissions

### Authentication Issues
- Clear cookies
- Check session expiration
- Verify Supabase auth configuration

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)

---

**Congratulations!** You've built a complete e-commerce platform with Next.js 14, Supabase, and modern React patterns. This guide covers the essential features needed for a production-ready e-commerce application.
