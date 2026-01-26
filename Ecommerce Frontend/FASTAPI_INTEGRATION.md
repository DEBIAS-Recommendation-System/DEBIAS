# DEBIAS E-commerce Frontend - FastAPI Integration

## 🎯 Project Overview

This document outlines the refactoring of the Next.js e-commerce frontend to work with the FastAPI backend, transforming it from a toy store into **DEBIAS** - a general-purpose Amazon-style marketplace with AI-powered debiased product recommendations.

## 🔄 Major Changes

### 1. Backend Migration: Supabase → FastAPI

**Previous**: The frontend used Supabase for backend services
**Now**: Integrated with FastAPI backend at `http://127.0.0.1:8000`

### 2. Theme Transformation: Toy Store → General Marketplace

**Previous**: Kid-themed design for toys
**Now**: Professional, trust-focused Amazon-style interface

### 3. Core DEBIAS Logic Implementation

Implements "Category-Relative Affordability" instead of absolute price filtering to solve "Relevance Saturation Bias."

---

## 📁 New File Structure

```
src/
├── api/
│   └── fastapi/                    # NEW: FastAPI integration
│       ├── index.ts
│       ├── authApi.ts             # Authentication endpoints
│       ├── productsApi.ts         # Products + DEBIAS search
│       ├── categoriesApi.ts       # Categories
│       ├── cartsApi.ts            # Shopping cart
│       └── accountApi.ts          # User account
├── lib/
│   └── fastapi.ts                  # NEW: Axios client with auth interceptors
├── types/
│   └── fastapi.types.ts            # NEW: TypeScript interfaces for FastAPI
├── utils/
│   └── productUtils.ts             # NEW: Badge logic, price tiers
└── components/
    ├── search/
    │   └── DebiasSearch.tsx        # NEW: AI-powered search with budget slider
    └── auth/
        └── AuthForm.tsx            # NEW: Login/Signup component
```

---

## 🔧 Environment Configuration

Create a `.env.local` file in the frontend root:

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Optional: For production
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 🚀 API Services

### Authentication (`authApi`)

```typescript
import { authApi } from '@/api/fastapi';

// Login
const tokens = await authApi.login({ username, password });

// Signup
await authApi.signup({ full_name, username, email, password });

// Logout
authApi.logout();

// Check if authenticated
const isAuth = authApi.isAuthenticated();
```

### Products (`productsApi`)

```typescript
import { productsApi } from '@/api/fastapi';

// Get all products
const products = await productsApi.getProducts({ page: 1, limit: 20 });

// Get single product
const product = await productsApi.getProduct(123);

// DEBIAS Search (AI-powered)
const results = await productsApi.debiasSearch({
  query: 'gaming mouse',
  budget: 50,
  limit: 30
});

// Get hub products (for cold start)
const hubs = await productsApi.getHubProducts(20);
```

### Categories, Carts, Account

All follow similar patterns. See individual API files for details.

---

## 🎨 DEBIAS Features

### 1. Explainability Badges

Products display badges based on `price_percentile` and `budget_hub`:

- **Popular Starter** (blue) - `budget_hub: true`
- **Great Value** (green) - `price_percentile < 0.3`
- **Premium Pick** (purple) - `price_percentile > 0.7`

```typescript
import { getProductBadges } from '@/utils/productUtils';

const badges = getProductBadges(product);
// Returns: [{ label: 'Great Value', type: 'value', color: 'green' }]
```

### 2. Price Tiers

```typescript
import { getPriceTier, getPriceExplanation } from '@/utils/productUtils';

const tier = getPriceTier(0.15); // 'budget'
const explanation = getPriceExplanation(0.15, 'Laptops');
// "This is among the most affordable options in Laptops."
```

### 3. Debiased Search

The search component (`DebiasSearch.tsx`) includes:

- **Text Query Input**: Natural language search
- **Budget Slider**: Financial constraint ($10 - $5,000)
- **Explainable Results**: Products shown in semantic relevance order (NOT price-sorted)

```tsx
import DebiasSearch from '@/components/search/DebiasSearch';

<DebiasSearch />
```

**Key Point**: Results are displayed in the exact order returned by the backend. The backend uses vector search + budget constraints to provide the optimal ranking.

---

## 🔐 Authentication Flow

1. **Login/Signup**: User submits credentials
2. **Token Storage**: `access_token` and `refresh_token` stored in `localStorage`
3. **Auto-Injection**: Axios interceptor adds `Authorization: Bearer <token>` to requests
4. **Auto-Refresh**: If 401 error, automatically refreshes token and retries
5. **Logout**: Clears tokens and redirects to login

---

## 📊 Data Types

### Product Interface

```typescript
interface Product {
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
  
  // DEBIAS specific
  price_percentile?: number;  // 0.0 to 1.0
  budget_hub?: boolean;       // Popular hub product
}
```

---

## 🎯 Implementation Checklist

- [x] Create FastAPI axios client with interceptors
- [x] Define TypeScript types matching backend schemas
- [x] Build API service layer (auth, products, categories, carts, account)
- [x] Implement authentication with OAuth2 token flow
- [x] Create DebiasSearch component with budget slider
- [x] Build product badge system for explainability
- [x] Create utility functions for price tiers and formatting
- [ ] Update existing React Query hooks to use FastAPI
- [ ] Replace Supabase calls throughout the app
- [ ] Update UI theme (colors, fonts, branding)
- [ ] Test all endpoints with running FastAPI backend
- [ ] Add error boundaries and loading states
- [ ] Implement cart persistence with FastAPI
- [ ] Update home page for hub products (cold start)
- [ ] Add personalized recommendations for logged-in users

---

## 🧪 Testing

### 1. Start the FastAPI Backend

```bash
cd Ecommerce-API
C:/Users/abbes/Desktop/DEBIAS/Ecommerce-API/venv/Scripts/python.exe run.py
```

Backend runs at: `http://127.0.0.1:8000`

### 2. Test Auth

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"
```

### 3. Start Frontend

```bash
cd "Ecommerce Frontend"
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🚨 Important Notes

### DO NOT Sort Results Client-Side

The backend returns products in a specific "debiased" order that balances semantic relevance with budget constraints. **Never re-sort the results by price** - this defeats the purpose of the DEBIAS algorithm.

```typescript
// ❌ WRONG
const sorted = results.sort((a, b) => a.price - b.price);

// ✅ CORRECT
// Render results in the exact order received
results.map(product => <ProductCard key={product.id} product={product} />)
```

### Category-Relative Pricing

Budget is category-relative:
- $50 for a **Pen** = Premium/Luxury
- $50 for a **Laptop** = Impossible/Ultra-Budget

The backend handles this logic via `price_percentile`.

---

## 📚 API Documentation

Full API docs available at:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

---

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors, the FastAPI backend needs CORS middleware. Add to `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Expiration

Tokens expire after 90 minutes (configurable in backend `.env`). The axios interceptor handles refresh automatically.

### Environment Variables

Ensure `NEXT_PUBLIC_API_URL` is set. Default is `http://127.0.0.1:8000`.

---

## 📖 Next Steps

1. **Replace Existing Hooks**: Update all React Query hooks in `src/hooks/data/` to use FastAPI
2. **Update Components**: Replace Supabase calls in components with FastAPI services
3. **Theme Overhaul**: Change color scheme from playful to professional (see `tailwind.config.ts`)
4. **Add Loading States**: Use React Query's `isLoading` states
5. **Error Handling**: Implement error boundaries and user-friendly error messages

---

## 🤝 Contributing

When adding new features:

1. Define types in `fastapi.types.ts`
2. Create API functions in `api/fastapi/`
3. Use existing axios client (`@/lib/fastapi`)
4. Follow the response wrapper pattern (`ApiResponse<T>`)
5. Add explainability where relevant (badges, tooltips)

---

## 📝 License

This project is part of the DEBIAS hackathon.

---

**Happy Coding! 🚀**
