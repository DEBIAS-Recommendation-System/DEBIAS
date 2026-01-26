const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '..', 'src', 'data', 'optimized_matches_quadratic.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
function parseCSVLine(line) {
  const values = [];
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

const lines = csvText.trim().split('\n');
const headers = lines[0].split(',');
const products = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const values = parseCSVLine(line);
  const row = {};
  
  headers.forEach((header, index) => {
    row[header.trim()] = values[index]?.trim() || '';
  });
  
  // Extract ONLY the fields we need
  const product = {
    product_id: row.product_id,
    title: row.title,
    imgUrl: row.imgUrl,
    brand: row.brand,
    price_dec: parseFloat(row.price_dec) || 0,
    category_code: row.category_code
  };
  
  products.push(product);
}

// Generate TypeScript file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'products.generated.ts');
const fileContent = `// Auto-generated from CSV file - DO NOT EDIT MANUALLY
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

// Console log first 10 image URLs from CSV products
console.log('First 10 product image URLs from CSV:');
products.slice(0, 10).forEach((product, index) => {
  console.log(\`\${index + 1}. \${product.title}: \${product.imgUrl}\`);
});
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`✅ Generated ${products.length} products from CSV`);
console.log(`📄 Output: ${outputPath}`);
