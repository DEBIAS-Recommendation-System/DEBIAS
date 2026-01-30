// Test category filtering logic
const { products } = require('./products.generated.ts');

// Categories we're filtering by
const categories = [
  "Accessories",
  "Apparel",
  "Appliances",
  "Computers",
  "Construction",
  "Electronics",
  "Furniture",
  "Kids",
  "Sport"
];

// Function to filter products by category
function filterProductsByCategory(products, categoryName) {
  if (!categoryName) return products;
  
  // Convert category name to lowercase and match the first part of category_code
  const categoryPrefix = categoryName.toLowerCase();
  
  return products.filter(product => {
    // Extract the first part of category_code (e.g., "apparel" from "apparel.jeans")
    const productCategory = product.category_code.split('.')[0];
    return productCategory === categoryPrefix;
  });
}

// Test filtering by different categories
console.log('Total products:', products.length);
console.log('\n--- Testing Category Filters ---\n');

categories.forEach(category => {
  const filtered = filterProductsByCategory(products, category);
  console.log(`${category}: ${filtered.length} products`);
  
  // Show first 3 products as examples
  if (filtered.length > 0) {
    console.log('  Examples:');
    filtered.slice(0, 3).forEach(p => {
      console.log(`    - ${p.title.substring(0, 50)}... (${p.category_code})`);
    });
  }
  console.log('');
});

// Test specific categories
console.log('\n--- Detailed Test: Apparel ---');
const apparelProducts = filterProductsByCategory(products, 'Apparel');
console.log(`Found ${apparelProducts.length} apparel products`);

// Get unique subcategories
const apparelSubcategories = [...new Set(apparelProducts.map(p => p.category_code))].sort();
console.log('Subcategories:', apparelSubcategories);

console.log('\n--- Detailed Test: Computers ---');
const computerProducts = filterProductsByCategory(products, 'Computers');
console.log(`Found ${computerProducts.length} computer products`);

const computerSubcategories = [...new Set(computerProducts.map(p => p.category_code))].sort();
console.log('Subcategories:', computerSubcategories);

console.log('\n--- Detailed Test: Electronics ---');
const electronicsProducts = filterProductsByCategory(products, 'Electronics');
console.log(`Found ${electronicsProducts.length} electronics products`);

const electronicsSubcategories = [...new Set(electronicsProducts.map(p => p.category_code))].sort();
console.log('Subcategories:', electronicsSubcategories);
