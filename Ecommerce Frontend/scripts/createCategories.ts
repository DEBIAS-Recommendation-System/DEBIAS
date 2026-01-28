import { authApi } from "../src/api/fastapi/auth";
import { categoriesApi } from "../src/api/fastapi/categories";

const categories = [
  { name: "Chef & Kitchen", icon: "chef-hat.svg" },
  { name: "Fashion & Apparel", icon: "dress.svg" },
  { name: "Gaming & Electronics", icon: "game-controller.svg" },
  { name: "Home & Lighting", icon: "lamp.svg" },
  { name: "Electronics & Power", icon: "lightning.svg" },
  { name: "Sports & Footwear", icon: "sneaker.svg" },
  { name: "Tech & Software", icon: "windows-logo.svg" },
];

async function createCategories() {
  try {
    // Login as admin
    console.log("Logging in as admin...");
    await authApi.login({
      username: "admin",
      password: "admin",
    });
    console.log("Logged in successfully!");

    // Create each category
    for (const category of categories) {
      try {
        console.log(`Creating category: ${category.name}...`);
        const result = await categoriesApi.create({ name: category.name });
        console.log(`✓ Created: ${result.data.name} (ID: ${result.data.id})`);
      } catch (error: any) {
        console.error(`✗ Failed to create ${category.name}:`, error.response?.data || error.message);
      }
    }

    console.log("\nAll categories created!");
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

createCategories();
