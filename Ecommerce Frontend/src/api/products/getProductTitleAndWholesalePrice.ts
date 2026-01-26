"use server";

// Simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function getProductTitleAndWholesalePrice(productId : string) {
  // Simulate async operation with 300ms delay
  await delay(300);
  
  // Lazy load products only when needed
  const { products: csvProducts } = await import('@/data/products.generated');
  
  const product = csvProducts.find(p => p.product_id === productId);
  
  if (!product) {
    return { error: "Product not found" };
  }
  
  return { 
    title: product.title, 
    wholesalePrice: product.price_dec * 0.8 // 80% of retail price
  };
}

