# FastAPI Endpoints Documentation

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "User created successfully",
  "id": 1,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /auth/login
Authenticate user with username and password.

**Request Body (Form Data):**
```
username: johndoe
password: securepassword123
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:**
```
refresh-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Products Endpoints

### GET /products/price-range
Get the minimum and maximum prices from all products in the database.

**Response (200 OK):**
```json
{
  "min_price": 5.99,
  "max_price": 2999.99
}
```

**Use Case:** Dynamically set price filter range in frontend.

---

### GET /products/
Get all products with filtering, searching, sorting, and pagination.

**Query Parameters:**
- `page` (integer, default: 1): Page number (minimum 1)
- `limit` (integer, default: 10): Items per page (1-100)
- `search` (string, optional): Search products by title
- `category` (string, optional): Filter by category. Supports multiple categories separated by commas (e.g., `Apparel,Electronics`)
- `minPrice` (float, optional): Minimum price filter
- `maxPrice` (float, optional): Maximum price filter
- `sort_by` (string, optional): Sort field - one of: `price`, `title`, `product_id`
- `order` (string, default: "asc"): Sort order - `asc` or `desc`

**Example Requests:**
```
GET /products/?page=1&limit=20
GET /products/?category=Apparel,Electronics&minPrice=10&maxPrice=100
GET /products/?search=laptop&sort_by=price&order=asc
GET /products/?category=Kids&sort_by=product_id&order=desc
```

**Response (200 OK):**
```json
{
  "message": "Products retrieved successfully",
  "data": [
    {
      "product_id": 1,
      "title": "Wireless Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 99.99,
      "category": "Electronics",
      "brand": "AudioTech",
      "imgUrl": "https://example.com/headphones.jpg",
      "stock": 50
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

**Multi-Category Filtering:**
When multiple categories are provided (comma-separated), products matching ANY of the categories will be returned (OR logic).

Example: `category=Apparel,Electronics,Kids` returns products from Apparel OR Electronics OR Kids.

---

### GET /products/{product_id}
Get a single product by ID.

**Path Parameters:**
- `product_id` (integer): The product ID

**Response (200 OK):**
```json
{
  "message": "Product retrieved successfully",
  "id": 1,
  "data": {
    "product_id": 1,
    "title": "Wireless Headphones",
    "description": "High-quality wireless headphones",
    "price": 99.99,
    "category": "Electronics",
    "brand": "AudioTech",
    "imgUrl": "https://example.com/headphones.jpg",
    "stock": 50
  }
}
```

---

### POST /products/
Create a new product (admin only).

**Authentication:** Requires Bearer token with admin role.

**Request Body:**
```json
{
  "title": "New Product",
  "description": "Product description",
  "price": 49.99,
  "category": "Electronics",
  "brand": "BrandName",
  "imgUrl": "https://example.com/image.jpg",
  "stock": 100
}
```

**Response (201 Created):**
```json
{
  "message": "Product created successfully",
  "id": 123,
  "data": {
    "product_id": 123,
    "title": "New Product",
    ...
  }
}
```

---

### PUT /products/{product_id}
Update an existing product (admin only).

**Authentication:** Requires Bearer token with admin role.

**Path Parameters:**
- `product_id` (integer): The product ID

**Request Body:**
```json
{
  "title": "Updated Product",
  "price": 59.99,
  "stock": 75
}
```

**Response (200 OK):**
```json
{
  "message": "Product updated successfully",
  "id": 123,
  "data": {
    "product_id": 123,
    "title": "Updated Product",
    ...
  }
}
```

---

### DELETE /products/{product_id}
Delete a product (admin only).

**Authentication:** Requires Bearer token with admin role.

**Path Parameters:**
- `product_id` (integer): The product ID

**Response (200 OK):**
```json
{
  "message": "Product deleted successfully",
  "id": 123,
  "data": null
}
```

---

## Account Management Endpoints

### GET /me/
Get current user's account information.

**Authentication:** Requires Bearer token.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "carts": []
  }
}
```

---

### PUT /me/
Update current user's account information.

**Authentication:** Requires Bearer token.

**Request Body:**
```json
{
  "username": "johndoe2",
  "email": "newemail@example.com",
  "full_name": "John Updated Doe"
}
```

**Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "username": "johndoe2",
    "email": "newemail@example.com",
    "full_name": "John Updated Doe",
    ...
  }
}
```

---

### DELETE /me/
Delete current user's account.

**Authentication:** Requires Bearer token.

**Response (200 OK):**
```json
{
  "message": "User deleted successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    ...
  }
}
```

**Note:** This action is irreversible. User's tokens will be invalidated.

---

## Categories

The following main categories are available:
- Accessories
- Apparel
- Appliances
- Computers
- Construction
- Electronics
- Furniture
- Kids
- Sport

---

## Authentication

Most endpoints require authentication using JWT Bearer tokens:

```
Authorization: Bearer <access_token>
```

Tokens are obtained from the `/auth/login` endpoint and should be stored securely on the client side.

Admin-only endpoints require the user to have `role: "admin"` in their user record.

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "detail": "Invalid input data"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden:**
```json
{
  "detail": "Invalid Credentials"
}
```

**404 Not Found:**
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```
