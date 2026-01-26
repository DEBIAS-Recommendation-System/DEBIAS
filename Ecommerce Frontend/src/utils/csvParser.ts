import { Product, Category } from '@/types/fastapi.types';

export interface CSVProductRow {
  title: string;
  imgUrl: string;
  price_amz: string;
  category_id_amz: string;
  amazon_category_name: string;
  brand: string;
  category_code: string;
  event_time: string;
  event_type: string;
  product_id: string;
  category_id_dec: string;
  price_dec: string;
  user_id: string;
  user_session: string;
  txt_dec_final: string;
  txt_amz_final: string;
  final_score: string;
  price_diff: string;
  optimization_score: string;
}

/**
 * Parse CSV text into product rows
 */
export function parseCSV(csvText: string): CSVProductRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');
  const products: CSVProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    products.push(row as CSVProductRow);
  }

  return products;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

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
  return values;
}

/**
 * Transform CSV row to Product entity
 */
export function transformCSVToProduct(
  row: CSVProductRow,
  fallbackImage: string = '/home/products/product1.jpg'
): Product {
  const productId = parseInt(row.product_id) || 0;
  const price = parseFloat(row.price_dec) || 0;
  const categoryId = parseInt(row.category_id_dec) || 0;

  // Extract category info from category_code (e.g., "apparel.jeans" -> "Apparel")
  const categoryName = row.amazon_category_name || formatCategoryFromCode(row.category_code);

  const category: Category = {
    id: categoryId,
    name: categoryName,
  };

  // Use imgUrl from CSV, fallback to placeholder if empty or invalid
  const thumbnail = row.imgUrl && row.imgUrl.startsWith('http') 
    ? row.imgUrl 
    : fallbackImage;

  return {
    id: productId,
    title: row.title || 'Untitled Product',
    description: row.txt_amz_final || row.txt_dec_final || null,
    price: price,
    discount_percentage: 0, // CSV doesn't have this
    rating: parseFloat(row.final_score) * 5 || 4.0, // Scale final_score to 0-5 rating
    stock: 100, // Default stock
    brand: row.brand || 'Unknown',
    thumbnail: thumbnail,
    images: [thumbnail],
    is_published: true,
    created_at: row.event_time || new Date().toISOString(),
    category_id: categoryId,
    category: category,
    price_percentile: parseFloat(row.optimization_score) || 0.5,
    budget_hub: parseFloat(row.optimization_score) > 0.3, // High optimization = budget hub
  };
}

/**
 * Format category name from category code
 * e.g., "apparel.jeans" -> "Apparel"
 */
function formatCategoryFromCode(code: string): string {
  if (!code) return 'General';
  const parts = code.split('.');
  const mainCategory = parts[0] || 'General';
  return mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
}

/**
 * Load and parse CSV products from file content
 */
export async function loadCSVProducts(
  csvFilePath: string = '/data/optimized_matches_quadratic.csv',
  fallbackImage: string = '/home/products/product1.jpg'
): Promise<Product[]> {
  try {
    // In browser environment, fetch the CSV file
    const response = await fetch(csvFilePath);
    const csvText = await response.text();
    
    const csvRows = parseCSV(csvText);
    const products = csvRows.map(row => transformCSVToProduct(row, fallbackImage));
    
    return products;
  } catch (error) {
    console.error('Error loading CSV products:', error);
    return [];
  }
}

/**
 * Extract unique categories from CSV products
 */
export function extractCategories(products: Product[]): Category[] {
  const categoryMap = new Map<number, Category>();
  
  products.forEach(product => {
    if (!categoryMap.has(product.category_id)) {
      categoryMap.set(product.category_id, product.category);
    }
  });
  
  return Array.from(categoryMap.values());
}
