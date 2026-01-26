"use server";
import { DiscountTypeEnum } from "./../../types/database.tables.types";
import { Tables } from "@/types/database.types";
import { paginateQuery } from "@/helpers/paginateQuery";

// Cache transformed products to avoid re-transforming on every request
let cachedProducts: Tables<"products">[] | null = null;

// Transform CSV products to match database structure
async function transformCSVProductsToDBFormat(): Promise<Tables<"products">[]> {
  // Return cached products if already transformed
  if (cachedProducts) {
    return cachedProducts;
  }
  
  // Dynamically import products only when needed (lazy loading)
  const { products: csvProducts } = await import('@/data/products.generated');
  
  cachedProducts = csvProducts.map((csvProduct, index) => ({
    id: csvProduct.product_id,
    title: csvProduct.title || 'Untitled Product',
    subtitle: csvProduct.brand || '',
    description: `${csvProduct.brand} - ${csvProduct.category_code}`,
    price: csvProduct.price_dec,
    wholesale_price: csvProduct.price_dec * 0.8, // 80% of retail price
    discount: 0,
    discount_type: DiscountTypeEnum.PERCENTAGE,
    stock: 100,
    image_url: csvProduct.imgUrl && csvProduct.imgUrl.startsWith('http') 
      ? csvProduct.imgUrl 
      : '/home/products/product1.jpg',
    extra_images_urls: [csvProduct.imgUrl],
    category_id: (index % 10) + 1, // Distribute across 10 categories
    slug: csvProduct.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || null,
    created_at: new Date().toISOString(),
  }));
  
  return cachedProducts;
}

// Simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function getProducts({
  tableName,
  count = {},
  sort,
  minDiscount,
  priceRange,
  pagination,
  search,
  match,
  minStock,
}: {
  tableName: "products";
  count?: {
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
  };
  search?: { column: keyof Tables<"products">; value: string };
  sort?: {
    column: keyof Tables<"products">;
    ascending: boolean;
  };
  match?:
    | Partial<{ [k in keyof Tables<"products">]: Tables<"products">[k] }>
    | undefined;
  minDiscount?: number;
  minStock?: number;
  priceRange?: number[];
  category?: string;
  pagination?: {
    limit: number;
    page: number;
  };
}) {
  // Simulate async operation with 300ms delay for better UX
  await delay(300);

  // Get all products from CSV (with caching)
  let products = await transformCSVProductsToDBFormat();

  // Apply search filter
  if (search) {
    const searchValue = search.value.toLowerCase();
    products = products.filter(product => {
      const fieldValue = String(product[search.column] || '').toLowerCase();
      return fieldValue.includes(searchValue);
    });
  }

  // Apply match filter
  if (match) {
    products = products.filter(product => {
      return Object.entries(match).every(([key, value]) => {
        return product[key as keyof Tables<"products">] === value;
      });
    });
  }

  // Apply minDiscount filter
  if (minDiscount !== undefined) {
    products = products.filter(product => 
      product.discount >= minDiscount && 
      product.discount_type === DiscountTypeEnum.PERCENTAGE
    );
  }

  // Apply price range filter
  if (priceRange && priceRange.length === 2) {
    products = products.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
  }

  // Apply minStock filter
  if (minStock !== undefined) {
    products = products.filter(product => product.stock >= minStock);
  }

  // Get total count before pagination
  const totalCount = products.length;

  // Apply sorting
  if (sort) {
    products.sort((a, b) => {
      const aValue = a[sort.column];
      const bValue = b[sort.column];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.ascending 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.ascending ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }

  // Apply pagination
  if (pagination && !count.head) {
    const { start, end } = paginateQuery(pagination);
    products = products.slice(start, end + 1);
  }

  // If only count is requested
  if (count.head) {
    return {
      data: null,
      error: null,
      count: totalCount,
    };
  }

  return {
    data: products as Tables<"products">[] | null,
    error: null,
    count: totalCount,
  };
}
