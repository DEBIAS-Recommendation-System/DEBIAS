"use server";

// Simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function productsIncome() {
  // Simulate async operation with 300ms delay
  await delay(300);
  
  // Lazy load products only when needed
  const { products: csvProducts } = await import('@/data/products.generated');
  
  type ProductRow = { stock: number; price: number; discount: number; wholesale_price: number };
  
  // Transform CSV products and calculate income
  const products = csvProducts
    .map(p => ({
      stock: 100, // Default stock
      price: p.price_dec,
      discount: 0,
      wholesale_price: p.price_dec * 0.8, // 80% of retail
    }))
    .filter(p => p.stock > 0);
  
  const totalIncome = products.reduce((acc, product) => {
    const income = product.stock * ((product.price - product.discount) - product.wholesale_price);
    return acc + income;
  }, 0);

  return {
    totalIncome,
    error: null,
  };
}
