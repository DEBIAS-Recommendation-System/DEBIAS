const fs = require('fs');
const path = require('path');

// List of page files that are failing
const pages = [
  'src/app/(auth)/signup/page.tsx',
  'src/app/(auth)/change_password/page.tsx',
  'src/app/(auth)/forget_password/page.tsx',
  'src/app/(adminDashboard)/addProduct/page.tsx',
  'src/app/(adminDashboard)/earnings/page.tsx',
  'src/app/(adminDashboard)/stocks/page.tsx',
  'src/app/(adminDashboard)/orders/page.tsx',
  'src/app/(adminDashboard)/myProducts/page.tsx',
  'src/app/(dashboard)/Cart/page.tsx',
  'src/app/(dashboard)/Cart/Payment/page.tsx',
  'src/app/(dashboard)/Orders/page.tsx',
  'src/app/(dashboard)/wishlist/page.tsx',
  'src/app/test/page.tsx',
  'src/app/not-found.tsx',
];

const workspaceRoot = 'C:\\Users\\abbes\\Desktop\\DEBIAS\\Ecommerce Frontend';

pages.forEach(pageFile => {
  const filePath = path.join(workspaceRoot, pageFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${pageFile}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`✓ Already has dynamic export: ${pageFile}`);
    return;
  }
  
  // Find the first line after imports (look for export default or function)
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('export default') || line.startsWith('export async function') || line.startsWith('function ') || line.startsWith('export function')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    console.log(`⚠ Could not find insertion point: ${pageFile}`);
    return;
  }
  
  // Insert the dynamic export before the component
  lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic';\n");
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Added dynamic export: ${pageFile}`);
});

console.log('\n✅ Done!');
