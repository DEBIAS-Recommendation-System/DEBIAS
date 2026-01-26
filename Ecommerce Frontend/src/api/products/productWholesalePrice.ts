"use server";

// Simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function productsWholeSalePrice() {
  // Simulate async operation with 300ms delay
  await delay(300);
  
  // Lazy load products only when needed
  const { products: csvProducts } = await import('@/data/products.generated');
  
  type ProductRow = { stock: number; wholesale_price: number };
  
  // Transform CSV products
  const products: ProductRow[] = csvProducts.map(p => ({
    stock: 100, // Default stock
    wholesale_price: p.price_dec * 0.8, // 80% of retail price
  })).filter(p => p.stock > 0);
  
  const totaleWholesalePrice = products.reduce((acc, product) => {
    const productWholeSalePrice = product.stock * product.wholesale_price;
    return acc + productWholeSalePrice;
  }, 0);

  return {
    totaleWholesalePrice,
    error: null,
  };
}
