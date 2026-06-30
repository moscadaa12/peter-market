-- Peter Market - Migración a Supabase / PostgreSQL
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- ── Tablas ───────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_details (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER,
  product_name TEXT,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL
);

-- ── Seed: Usuarios por defecto ───────────────────────────────
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin Peter', 'admin@petermarket.pe', '$2a$10$dummy_hash_admin', 'admin'),
  ('Empleado Juan', 'empleado@petermarket.pe', '$2a$10$dummy_hash_empleado', 'empleado'),
  ('Cliente María', 'cliente@petermarket.pe', '$2a$10$dummy_hash_cliente', 'cliente')
ON CONFLICT (email) DO NOTHING;

-- ── Seed: Categorías ─────────────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Abarrotes'), ('Lácteos'), ('Snacks'), ('Limpieza'), ('Bebidas'),
  ('Panadería'), ('Cuidado Personal'), ('Carnes'), ('Frutas y Verduras'), ('Mascotas')
ON CONFLICT (name) DO NOTHING;
