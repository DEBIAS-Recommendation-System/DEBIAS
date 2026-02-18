# Product Population Scripts

This directory contains two scripts to populate the database with products from the `products.generated.ts` file in the frontend.

## Scripts

### 1. `populate_from_ts.py` (Recommended - Direct Database)

Directly inserts products into the database using SQLAlchemy. This is faster and more efficient.

**Usage:**
```bash
# Activate virtual environment
source venv/bin/activate  # On Linux/Mac
# or
.\venv\Scripts\activate   # On Windows

# Run the script
python populate_from_ts.py
```

**Advantages:**
- ✓ Very fast (uses batch inserts)
- ✓ No authentication required
- ✓ Automatically skips existing products
- ✓ Processes products in chunks of 1000

**Requirements:**
- Direct access to the database
- Database must be running

---

### 2. `populate_via_api.py` (Alternative - API Endpoint)

Creates products through the REST API endpoint. Useful when you don't have direct database access.

**Usage:**
```bash
# Activate virtual environment
source venv/bin/activate  # On Linux/Mac
# or
.\venv\Scripts\activate   # On Windows

# Install required package (if not already installed)
pip install requests

# Make sure the API is running
python run.py

# In another terminal, run the script
python populate_via_api.py
```

You will be prompted for admin credentials:
```
API Base URL: http://localhost:8000
Please enter admin credentials:
Username: admin
Password: ********
```

**Advantages:**
- ✓ Works remotely (doesn't need database access)
- ✓ Uses the same validation as the API
- ✓ Can work with a remote API server

**Disadvantages:**
- ✗ Slower (one API call per product)
- ✗ Requires admin authentication
- ✗ Requires the API server to be running

---

## Data Mapping

The scripts map the TypeScript product format to the database format:

| TypeScript Field | Database Field |
|-----------------|----------------|
| `product_id` | `product_id` |
| `title` | `title` |
| `brand` | `brand` |
| `category_code` | `category` |
| `price_dec` | `price` |
| `imgUrl` | `imgUrl` |

---

## Troubleshooting

### "TypeScript file not found"
Make sure the `Ecommerce Frontend` directory is at the same level as `Ecommerce-API`:
```
DEBIAS/
├── Ecommerce-API/
│   ├── populate_from_ts.py
│   └── populate_via_api.py
└── Ecommerce Frontend/
    └── src/data/products.generated.ts
```

### "Authentication failed" (API method)
Ensure you have an admin account. You can create one using the API or database directly.

### Database connection errors (Direct method)
Make sure:
1. The database is running
2. The `.env` file has correct database credentials
3. You're in the correct virtual environment

---

## Performance

- **Direct Database Method**: Can insert ~50,000 products in under 1 minute
- **API Method**: Takes longer due to HTTP overhead (approximately 1-2 seconds per product)

For large datasets (like the 51,000+ products in the file), use the **direct database method**.
