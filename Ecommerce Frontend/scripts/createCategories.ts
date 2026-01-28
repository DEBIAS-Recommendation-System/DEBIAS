const API_URL = "http://127.0.0.1:8000";

const categories = [
  { name: "Chef & Kitchen" },
  { name: "Fashion & Apparel" },
  { name: "Gaming & Electronics" },
  { name: "Home & Lighting" },
  { name: "Electronics & Power" },
  { name: "Sports & Footwear" },
  { name: "Tech & Software" },
];

async function createCategories() {
  try {
    // Login as admin
    console.log("Logging in as admin...");
    const formData = new URLSearchParams();
    formData.append("username", "admin");
    formData.append("password", "admin");

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    console.log("Logged in successfully!");

    // Create each category
    for (const category of categories) {
      try {
        console.log(`Creating category: ${category.name}...`);
        const response = await fetch(`${API_URL}/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(category),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`✗ Failed to create ${category.name}:`, error);
        } else {
          const result = await response.json();
          console.log(`✓ Created: ${result.data.name} (ID: ${result.data.id})`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to create ${category.name}:`, error.message);
      }
    }

    console.log("\nAll categories processed!");
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

createCategories();
