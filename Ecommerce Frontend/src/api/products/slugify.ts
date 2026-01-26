"use server";

import { slugify } from "@/helpers/slugify";

// Simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function slugifyProducts() {
  // Simulate async operation with 300ms delay
  await delay(300);
  
  // Lazy load products count only when needed
  const { products: csvProducts } = await import('@/data/products.generated');
  
  // Note: Since we're using static CSV data, slugs are generated at build time
  // This function is kept for compatibility but doesn't modify the CSV data
  console.log(`Slugs already generated for ${csvProducts.length} products from CSV`);
  
  return { success: true, message: "Slugs are pre-generated from CSV data" };
}
