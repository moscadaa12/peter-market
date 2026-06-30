-- Ejecutar UNA VEZ en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS users (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role  TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'empleado', 'cliente')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  offer_price NUMERIC(10,2),
  stock       INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER,
  user_name        TEXT,
  total_amount     NUMERIC(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pendiente',
  delivery_address TEXT,
  delivery_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_details (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER,
  product_name TEXT,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
