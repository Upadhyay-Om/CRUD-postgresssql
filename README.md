# 📦 Products API (Node.js + Express + PostgreSQL)

A production-ready REST API for managing product data with robust validation, secure database integration, and scalable structure.

---

## 🚀 Setup

### 1️⃣ Install PostgreSQL  
Download and install PostgreSQL from the official website.  
During installation, note:

- Username (e.g., `postgres`)
- Password  
- Port (default: `5432`)

Open **SQL Shell (psql)** and log in using those credentials.

---

### 2️⃣ Create Database & Table

Run the following in **psql**:

```sql
-- Create database
CREATE DATABASE products_db;
\c products_db;

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
3️⃣ Environment Configuration

Create a .env file in the project root:

DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=products_db

4️⃣ Install Dependencies
npm install


Required packages include:

express

pg

dotenv

zod

zod-validation-error

5️⃣ Run the Server
npm run dev


(Or use node index.js / nodemon depending on your configuration.)

🧠 Features
✔️ Modern Stack

Node.js + Express HTTP layer

PostgreSQL with UUID primary keys

Zod-based schema validation

Consistent error responses

🛠 CRUD Endpoints
➕ Create Product

POST /products

Body Example:

{
  "name": "Mac",
  "price": 1200,
  "quantity": 20,
  "image": "https://example.com/file.png"
}


Validation Rules:

name → required string (1–100 chars)

price → positive number

quantity → non-negative integer

image → valid URL (optional)

📄 Get Single Product

GET /products/:id

Validates UUID

Returns 400 if invalid format

Returns 404 if record not found

✏️ Update Product

PUT /products/:id
Supports partial updates (updateProductSchema.partial()).

❌ Delete Product

DELETE /products/:id
Returns deleted product or 404 if not found.

🔍 Pagination & Filtering

GET /products

Query params:

Param	Description
page	Page number (default: 1)
limit	Items per page (default: 10, max: 100)
name	Case-insensitive keyword search
minPrice	Minimum price
maxPrice	Maximum price (must be ≥ minPrice)

Example requests:

GET /products?page=1&limit=10
GET /products?name=mac&page=2
GET /products?minPrice=500&maxPrice=1500
GET /products?name=phone&limit=20&page=1&minPrice=200&maxPrice=1000


Example response:

{
  "products": [],
  "pagination": {
    "totalProducts": 42,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

🛡 Validation & Error Handling

Uses Zod with:

Body validation

URL param validation (UUID)

Query param validation

Example error:

{
  "message": "Invalid request body",
  "errors": "Validation error: Price must be positive at \"price\"; Name is required at \"name\""
}


Invalid UUID:

{
  "message": "Invalid URL parameters",
  "errors": "ID must be a valid UUID at \"id\""
}


Server failure fallback:

{
  "message": "Server Error"
}

🧪 Optional: Seed Test Data

Execute inside products_db:

INSERT INTO products (name, price, quantity, image)
VALUES ('Sample Product', 999.99, 10, 'https://example.com/sample.jpg');