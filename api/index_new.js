import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getClient from './db.js';
import { uploadBuffer, seedAllImages } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'peter-market-dev-secret-key';
const app = express();
const supabase = getClient();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push('https://' + process.env.VERCEL_URL);
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
}));
app.use(express.json());

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    } catch {}
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta accion' });
    }
    next();
  };
}

let initialized = false;
async function ensureDB(req, res, next) {
  if (!initialized) {
    try {
      await initDB();
      initialized = true;
    } catch (err) {
      console.error('DB init error:', err.message);
      return res.status(500).json({ error: 'Error de conexion con la base de datos', details: err.message });
    }
  }
  next();
}
app.use(ensureDB);

async function initDB() {
  const tables = [
    'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'empleado', 'cliente')), created_at TIMESTAMP DEFAULT NOW())',
    'CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT)',
    'CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id), name TEXT NOT NULL, description TEXT, price NUMERIC(10,2) NOT NULL, offer_price NUMERIC(10,2), stock INTEGER NOT NULL DEFAULT 0, image_url TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW())',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, user_id INTEGER, user_name TEXT, total_amount NUMERIC(10,2) NOT NULL, status TEXT NOT NULL DEFAULT 'pendiente', delivery_address TEXT, delivery_cost NUMERIC(10,2) NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())',
    'CREATE TABLE IF NOT EXISTS order_details (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER, product_name TEXT, quantity INTEGER NOT NULL, unit_price NUMERIC(10,2) NOT NULL, subtotal NUMERIC(10,2) NOT NULL)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
  ];
  for (const sql of tables) {
    const { error } = await supabase.rpc('exec_sql', { sql, params: [] });
    if (error && !error.message.includes('already exists')) throw error;
  }

  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (userCount === 0) {
    const hashes = await Promise.all([
      bcrypt.hash('admin123', 10), bcrypt.hash('empleado123', 10), bcrypt.hash('cliente123', 10),
    ]);
    await supabase.from('users').insert([
      { name: 'Admin Peter', email: 'admin@petermarket.pe', password_hash: hashes[0], role: 'admin' },
      { name: 'Empleado Juan', email: 'empleado@petermarket.pe', password_hash: hashes[1], role: 'empleado' },
      { name: 'Cliente Maria', email: 'cliente@petermarket.pe', password_hash: hashes[2], role: 'cliente' },
    ]);
  }

  const imageMap = await seedAllImages();

  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  if (catCount === 0) {
    const cats = ['Abarrotes', 'Lacteos', 'Snacks', 'Limpieza', 'Bebidas',
      'Panaderia', 'Cuidado Personal', 'Carnes', 'Frutas y Verduras', 'Mascotas'];
    for (const name of cats) {
      await supabase.from('categories').insert({ name });
    }

    const seedProducts = [
      { name: 'Arroz Superior Costeno x 5kg', cat:1, price:18.50, offer:15.90, stock:50, desc:'Arroz blanco extra superior, ideal para toda la familia.', img:'product-1782668292943.webp' },
      { name: 'Aceite Vegetal Primor x 1L', cat:1, price:9.90, offer:8.50, stock:40, desc:'Aceite vegetal puro, ideal para cocinar y freir.', img:'product-1782668266997.webp' },
