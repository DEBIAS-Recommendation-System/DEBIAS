# 🚀 Quick Start Guide - DEBIAS FastAPI Integration

## Prerequisites

- ✅ FastAPI backend running at `http://127.0.0.1:8000`
- ✅ PostgreSQL database set up and migrated
- ✅ Node.js installed (v18+)

---

## Step 1: Configure Environment

Create `.env.local` in the frontend root directory:

```bash
# Navigate to frontend folder
cd "C:\Users\abbes\Desktop\DEBIAS\Ecommerce Frontend"

# Create .env.local file
echo NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 > .env.local
```

---

## Step 2: Install Dependencies (if needed)

```bash
npm install axios
# or
pnpm add axios
```

> **Note**: axios should already be in package.json

---

## Step 3: Start the Backend (if not running)

```bash
cd "C:\Users\abbes\Desktop\DEBIAS\Ecommerce-API"
C:/Users/abbes/Desktop/DEBIAS/Ecommerce-API/venv/Scripts/python.exe run.py
```

Verify at: http://127.0.0.1:8000/docs

---

## Step 4: Test the API Integration

### A. Test Authentication

Create a test page: `src/app/test/page.tsx`

```tsx
'use client';

import { authApi } from '@/api/fastapi';

export default function TestPage() {
  const testLogin = async () => {
    try {
      const tokens = await authApi.login({
        username: 'admin',
        password: 'admin',
      });
      console.log('✅ Login successful:', tokens);
      alert('Login successful!');
    } catch (err) {
      console.error('❌ Login failed:', err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">FastAPI Integration Test</h1>
      <button
        onClick={testLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        Test Login
      </button>
    </div>
  );
}
```

Navigate to: `http://localhost:3000/test`

### B. Test Products

```tsx
'use client';

import { useProducts } from '@/hooks/useProductsQuery';

export default function ProductsTest() {
  const { data, isLoading, error } = useProducts({ page: 1, limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Products from FastAPI</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

---

## Step 5: Use the Search Component

Add to any page:

```tsx
import DebiasSearch from '@/components/search/DebiasSearch';

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Your Products</h1>
      <DebiasSearch />
    </div>
  );
}
```

---

## Step 6: Use Authentication

### Login Page

```tsx
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AuthForm />
    </div>
  );
}
```

---

## Common Integration Patterns

### Pattern 1: Fetch Products in a Component

```tsx
'use client';

import { useProducts } from '@/hooks/useProductsQuery';
import { formatPrice } from '@/utils/productUtils';

export default function ProductList() {
  const { data, isLoading } = useProducts({ limit: 20 });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {data?.data.map((product) => (
        <div key={product.id} className="border p-4 rounded">
          <img src={product.thumbnail} alt={product.title} />
          <h3>{product.title}</h3>
          <p>{formatPrice(product.price)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Add to Cart

```tsx
'use client';

import { useAddToCart } from '@/hooks/useCartQuery';

export default function AddToCartButton({ productId, cartId }) {
  const addToCart = useAddToCart();

  const handleClick = async () => {
    await addToCart.mutateAsync({
      cartId,
      productId,
      quantity: 1,
    });
    alert('Added to cart!');
  };

  return (
    <button
      onClick={handleClick}
      disabled={addToCart.isPending}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

### Pattern 3: Protected Route

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/fastapi';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return <div>Protected Content</div>;
}
```

---

## Troubleshooting

### Issue: CORS Error

**Solution**: Add CORS middleware to FastAPI backend:

```python
# In app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: 401 Unauthorized

**Solution**: Check if token is stored:

```javascript
console.log(localStorage.getItem('access_token'));
```

Clear and re-login:

```javascript
authApi.logout();
// Then login again
```

### Issue: "Cannot find module '@/api/fastapi'"

**Solution**: Ensure TypeScript paths are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Backend Not Responding

**Check**:
1. Is backend running? `http://127.0.0.1:8000/docs`
2. Is PostgreSQL running?
3. Check terminal for errors

**Restart Backend**:
```bash
cd Ecommerce-API
C:/Users/abbes/Desktop/DEBIAS/Ecommerce-API/venv/Scripts/python.exe run.py
```

---

## Next Steps

1. ✅ Test authentication (admin/admin)
2. ✅ Test product fetching
3. ✅ Test search component
4. 🔲 Migrate existing pages to use FastAPI
5. 🔲 Update theme and styling
6. 🔲 Add error handling and loading states

---

## Useful Commands

```bash
# Start backend
cd Ecommerce-API
venv\Scripts\python.exe run.py

# Start frontend
cd "Ecommerce Frontend"
npm run dev

# Test API endpoint
curl http://127.0.0.1:8000/products?limit=5

# Login via curl
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"
```

---

## Resources

- **Backend API Docs**: http://127.0.0.1:8000/docs
- **Integration Guide**: [FASTAPI_INTEGRATION.md](./FASTAPI_INTEGRATION.md)
- **Full Summary**: [REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md)

---

**Happy Coding! 🎉**
