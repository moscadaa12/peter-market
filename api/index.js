import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uploadBuffer, seedAllImages } from './storage.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'peter-market-dev-secret-key';

const app = express();

// ── CORS ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
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

// ── JWT Auth Middleware ─────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
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
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

// ── Database Pool ─────────────────────────────────────────────
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err) => console.error('Pool error:', err.message));
  }
  return pool;
}

// ── Init DB (lazy, on first request) ──────────────────────────
let initialized = false;
async function ensureDB(req, res, next) {
  if (!initialized) {
    try {
      await initDB();
      initialized = true;
    } catch (err) {
      console.error('DB init error:', err.message);
      return res.status(500).json({ error: 'Error de conexión con la base de datos', details: err.message });
    }
  }
  next();
}
app.use(ensureDB);

async function initDB() {
  const client = await getPool().connect();
  try {
    await client.query(`
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
    `);

    const { rows: userCount } = await client.query('SELECT COUNT(*)::int as count FROM users');
    if (userCount[0].count === 0) {
      const hashes = await Promise.all([
        bcrypt.hash('admin123', 10),
        bcrypt.hash('empleado123', 10),
        bcrypt.hash('cliente123', 10),
      ]);
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
        ['Admin Peter', 'admin@petermarket.pe', hashes[0], 'admin']
      );
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
        ['Empleado Juan', 'empleado@petermarket.pe', hashes[1], 'empleado']
      );
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
        ['Cliente María', 'cliente@petermarket.pe', hashes[2], 'cliente']
      );
    }

    const imageMap = await seedAllImages();

    const { rows: catCount } = await client.query('SELECT COUNT(*)::int as count FROM categories');
    if (catCount[0].count === 0) {
      const defaultCategories = [
        'Abarrotes', 'Lácteos', 'Snacks', 'Limpieza', 'Bebidas',
        'Panadería', 'Cuidado Personal', 'Carnes', 'Frutas y Verduras', 'Mascotas',
      ];
      for (const name of defaultCategories) {
        await client.query('INSERT INTO categories (name) VALUES ($1)', [name]);
      }

      const seedProducts = [
        { name: 'Arroz Superior Costeño x 5kg', cat:1, price:18.50, offer:15.90, stock:50, desc:'Arroz blanco extra superior, ideal para toda la familia.', img:'product-1782668292943.webp' },
        { name: 'Aceite Vegetal Primor x 1L', cat:1, price:9.90, offer:8.50, stock:40, desc:'Aceite vegetal puro, ideal para cocinar y freír.', img:'product-1782668266997.webp' },
        { name: 'Fideos Don Vittorio x 500g', cat:1, price:3.20, stock:60, desc:'Fideos de sémola de trigo, cocción perfecta.', img:'product-1782668258528.jpeg' },
        { name: 'Azúcar Blanca Cartavio x 5kg', cat:1, price:16.90, offer:13.50, stock:30, desc:'Azúcar refinada blanca, endulza tus comidas.', img:'product-1782668251847.webp' },
        { name: 'Sal Marina Emsal x 1kg', cat:1, price:1.80, stock:100, desc:'Sal marina fina, ideal para cocinar.', img:'product-1782668292943.webp' },
        { name: 'Lentejas x 1kg', cat:1, price:4.50, offer:3.80, stock:45, desc:'Lentejas seleccionadas, ricas en hierro.', img:'product-1782668266997.webp' },
        { name: 'Frijol Canario x 1kg', cat:1, price:5.20, stock:35, desc:'Frijol canario peruano de primera calidad.', img:'product-1782668258528.jpeg' },
        { name: 'Harina Blanca Flor x 1kg', cat:1, price:3.80, stock:55, desc:'Harina de trigo pre cernida, ideal para repostería.', img:'product-1782668251847.webp' },
        { name: 'Avena Tres Ositos x 400g', cat:1, price:4.10, offer:3.50, stock:40, desc:'Avena en hojuelas, nutritiva y deliciosa.', img:'product-1782668292943.webp' },
        { name: 'Leche Evaporada Gloria x 400g', cat:2, price:4.20, stock:80, desc:'Leche evaporada entera, rica y cremosa.', img:'product-1782668242992.webp' },
        { name: 'Leche Fresca Gloria x 1L', cat:2, price:5.50, offer:4.90, stock:60, desc:'Leche fresca entera, directo de la granja.', img:'product-1782668205316.webp' },
        { name: 'Queso Fresco Mantecoso x 500g', cat:2, price:14.00, offer:11.90, stock:25, desc:'Queso fresco de vaca, suave y delicioso.', img:'product-1782668242992.webp' },
        { name: 'Yogurt Batido Gloria frutillado x 1L', cat:2, price:6.80, stock:35, desc:'Yogurt batido sabor frutilla, cremoso y refrescante.', img:'product-1782668205316.webp' },
        { name: 'Mantequilla Gloria x 200g', cat:2, price:7.20, offer:6.20, stock:30, desc:'Mantequilla de crema de leche, sabor casero.', img:'product-1782668242992.webp' },
        { name: 'Crema de Leche Gloria x 200ml', cat:2, price:5.90, stock:20, desc:'Crema de leche espesa, ideal para salsas.', img:'product-1782668205316.webp' },
        { name: 'Galletas Soda Campo x 300g', cat:3, price:3.50, stock:90, desc:'Galletas tipo soda, clásicas y crujientes.', img:'product-1782668190172.jpeg' },
        { name: 'Galletas Oreo x 120g', cat:3, price:4.90, offer:4.20, stock:70, desc:'Galletas con crema sabor vainilla, clásicas.', img:'product-1782668190172.jpeg' },
        { name: 'Papas Lays Clásicas x 150g', cat:3, price:5.60, stock:65, desc:'Papas fritas crocantes, sabor clásico.', img:'product-1782668190172.jpeg' },
        { name: 'Chocolate Sublime x 130g', cat:3, price:4.50, offer:3.90, stock:50, desc:'Chocolate con leche y maní, crocante.', img:'product-1782668190172.jpeg' },
        { name: 'Caramelos Nacionales x 50g', cat:3, price:2.20, stock:120, desc:'Caramelos duros de diversos sabores.', img:'product-1782668190172.jpeg' },
        { name: 'Chizitos Bolivares x 200g', cat:3, price:3.90, stock:45, desc:'Snack de maíz sabor a queso.', img:'product-1782668190172.jpeg' },
        { name: 'Mix de Frutos Secos x 150g', cat:3, price:8.50, offer:7.20, stock:20, desc:'Mezcla de almendras, nueces y pasas.', img:'product-1782668190172.jpeg' },
        { name: 'Detergente Bolívar x 900g', cat:4, price:7.20, stock:40, desc:'Detergente en polvo con aroma a limón.', img:'product-1782668179829.jpeg' },
        { name: 'Lejía Sapolio x 1L', cat:4, price:5.60, offer:4.90, stock:55, desc:'Lejía desinfectante para el hogar.', img:'product-1782668160150.jpeg' },
        { name: 'Papel Higiénico Suave x 4 rollos', cat:4, price:6.80, stock:80, desc:'Papel higiénico doble hoja, suave y resistente.', img:'product-1782668179829.jpeg' },
        { name: 'Lavavajillas Ayudín x 500ml', cat:4, price:4.30, stock:35, desc:'Detergente líquido para vajilla, poder desengrasante.', img:'product-1782668160150.jpeg' },
        { name: 'Desinfectante Sapolio x 1L', cat:4, price:6.10, offer:5.30, stock:30, desc:'Desinfectante concentrado aroma a lavanda.', img:'product-1782668179829.jpeg' },
        { name: 'Esponja Multiusos x 3', cat:4, price:2.50, stock:100, desc:'Esponjas para lavar vajilla, resistentes.', img:'product-1782668179829.jpeg' },
        { name: 'Bolsa de Basura x 10', cat:4, price:3.20, stock:90, desc:'Bolsas resistentes para residuos domésticos.', img:'product-1782668179829.jpeg' },
        { name: 'Gaseosa Inca Kola x 1L', cat:5, price:4.80, stock:75, desc:'Gaseosa peruana sabor único, bien fría.', img:'product-1782668133232.webp' },
        { name: 'Gaseosa Coca Cola x 1L', cat:5, price:5.20, offer:4.50, stock:75, desc:'Gaseosa carbonatada sabor clásico.', img:'product-1782668133232.webp' },
        { name: 'Agua San Luis x 1.5L', cat:5, price:3.00, stock:100, desc:'Agua mineral natural, pura y saludable.', img:'product-1782668133232.webp' },
        { name: 'Jugo Del Valle x 1L', cat:5, price:5.50, stock:40, desc:'Jugo de fruta natural, sabor durazno.', img:'product-1782668133232.webp' },
        { name: 'Cerveza Cusqueña x 620ml', cat:5, price:7.50, offer:6.50, stock:50, desc:'Cerveza peruana rubia de alta calidad.', img:'product-1782668133232.webp' },
        { name: 'Pan Molde Bimbo x 500g', cat:6, price:6.90, stock:30, desc:'Pan de molde blanco, suave y esponjoso.', img:'product-1782668081288.webp' },
        { name: 'Pan Francés x unidad', cat:6, price:0.80, stock:200, desc:'Pan francés artesanal, horneado al día.', img:'product-1782668081288.webp' },
        { name: 'Torta de Chocolate x 500g', cat:6, price:18.00, offer:15.50, stock:10, desc:'Torta de chocolate húmeda y decorada.', img:'product-1782668081288.webp' },
        { name: 'Queque de Vainilla x 400g', cat:6, price:9.50, stock:15, desc:'Queque esponjoso sabor vainilla con chispas.', img:'product-1782668081288.webp' },
        { name: 'Jabón de Tocador Protex x 100g', cat:7, price:3.20, stock:60, desc:'Jabón antibacterial, protección duradera.', img:'product-1782668064128.webp' },
        { name: 'Shampoo Sedal ceramidas x 400ml', cat:7, price:12.90, offer:10.90, stock:25, desc:'Shampoo nutritivo para cabello saludable.', img:'product-1782668064128.webp' },
        { name: 'Desodorante Axe x 150ml', cat:7, price:11.50, stock:30, desc:'Desodorante en aerosol, frescura prolongada.', img:'product-1782668064128.webp' },
        { name: 'Pasta Dental Colgate x 120g', cat:7, price:4.80, stock:50, desc:'Pasta dental con flúor, protección anticaries.', img:'product-1782668064128.webp' },
        { name: 'Cepillo Dental Colgate', cat:7, price:3.50, stock:40, desc:'Cepillo dental de cerdas suaves, mango ergonómico.', img:'product-1782668064128.webp' },
        { name: 'Pollo Entero x 1kg', cat:8, price:11.50, offer:9.90, stock:25, desc:'Pollo fresco de corral, limpio y listo para cocinar.', img:'product-1782668046601.webp' },
        { name: 'Carne Molida Especial x 500g', cat:8, price:12.00, stock:20, desc:'Carne de res molida, 100% pura.', img:'product-1782668046601.webp' },
        { name: 'Bisteck de Res x 500g', cat:8, price:16.00, offer:13.90, stock:15, desc:'Bisteck de res tierno, ideal para parrilla.', img:'product-1782668046601.webp' },
        { name: 'Chuleta de Cerdo x 500g', cat:8, price:13.50, stock:18, desc:'Chuleta de cerdo fresca, jugosa y sabrosa.', img:'product-1782668046601.webp' },
        { name: 'Plátano de Seda x 1kg', cat:9, price:3.50, stock:40, desc:'Plátano de seda dulce, ideal para postres.', img:'product-1782667981514.webp' },
        { name: 'Manzana Delicia x 1kg', cat:9, price:4.80, offer:4.10, stock:35, desc:'Manzana delicia peruana, dulce y crujiente.', img:'product-1782667914546.webp' },
        { name: 'Cebolla Roja x 1kg', cat:9, price:2.50, stock:50, desc:'Cebolla roja fresca, ideal para guisos.', img:'product-1782667981514.webp' },
        { name: 'Tomate x 1kg', cat:9, price:3.20, stock:45, desc:'Tomate fresco y jugoso, para ensaladas.', img:'product-1782667914546.webp' },
        { name: 'Papa Amarilla x 1kg', cat:9, price:2.80, stock:60, desc:'Papa amarilla peruana, cremosa y deliciosa.', img:'product-1782667981514.webp' },
        { name: 'Zanahoria x 1kg', cat:9, price:2.00, stock:55, desc:'Zanahoria fresca, rica en vitaminas.', img:'product-1782667914546.webp' },
        { name: 'Palta Hass x 500g', cat:9, price:5.50, offer:4.80, stock:20, desc:'Palta hass madura, cremosa y deliciosa.', img:'product-1782667981514.webp' },
        { name: 'Limón x 500g', cat:9, price:2.30, stock:50, desc:'Limón fresco y ácido, ideal para bebidas.', img:'product-1782667914546.webp' },
        { name: 'Comida para Perro Ricocan x 2kg', cat:10, price:18.50, stock:20, desc:'Alimento balanceado para perros adultos.', img:'product-1782667813537.webp' },
        { name: 'Comida para Gato Whiskas x 1kg', cat:10, price:14.90, offer:12.90, stock:15, desc:'Alimento para gatos adultos sabor pescado.', img:'product-1782667804355.webp' },
        { name: 'Arena Sanitaria para Gato x 4kg', cat:10, price:11.00, stock:12, desc:'Arena aglomerante, control de olores.', img:'product-1782667813537.webp' },
        { name: 'Snack para Perro Mimaskot x 150g', cat:10, price:6.50, stock:25, desc:'Galletas sabor a pollo para perro.', img:'product-1782667804355.webp' },
      ];

      for (const p of seedProducts) {
        const imgUrl = imageMap[p.img] || `/images/products/${p.img}`;
        await client.query(
          'INSERT INTO products (name, category_id, price, offer_price, stock, description, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [p.name, p.cat, p.price, p.offer ?? null, p.stock, p.desc, imgUrl]
        );
      }
    }
  } finally {
    client.release();
  }
}

// ── Auth routes ────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const { rows: existing } = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing[0]) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await getPool().query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, created_at',
    [name, email, hash, 'cliente']
  );
  const user = rows[0];
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0]) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const user = rows[0];
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const { rows } = await getPool().query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json(rows[0]);
});

// ── Users CRUD (admin only) ────────────────────────────────────
app.get('/api/auth/users', requireAuth, requireRole('admin'), async (_req, res) => {
  const { rows } = await getPool().query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY id'
  );
  res.json(rows);
});

app.post('/api/auth/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const { rows: existing } = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing[0]) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await getPool().query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, created_at',
    [name, email, hash, role || 'cliente']
  );
  res.status(201).json(rows[0]);
});

app.put('/api/auth/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { rows: existing } = await getPool().query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!existing[0]) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  const { name, email, role, password } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await getPool().query(
      'UPDATE users SET name=$1, email=$2, role=$3, password_hash=$4 WHERE id=$5',
      [name || existing[0].name, email || existing[0].email, role || existing[0].role, hash, req.params.id]
    );
  } else {
    await getPool().query(
      'UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4',
      [name || existing[0].name, email || existing[0].email, role || existing[0].role, req.params.id]
    );
  }
  const { rows: updated } = await getPool().query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  res.json(updated[0]);
});

app.delete('/api/auth/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!rows[0]) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  await getPool().query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ message: 'Usuario eliminado' });
});

// ── Upload de imágenes ────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

app.post('/api/upload', requireAuth, requireRole('admin', 'empleado'), (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });

    const ext = path.extname(req.file.originalname) || '.jpg';
    const fileName = `product-${Date.now()}${ext}`;
    const url = await uploadBuffer(req.file.buffer, fileName, req.file.mimetype);
    if (!url) {
      return res.status(500).json({ error: 'Error al subir la imagen al almacenamiento' });
    }
    res.json({ image_url: url });
  });
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const client = await getPool().connect();
    const { rows } = await client.query('SELECT NOW() as time');
    client.release();
    res.json({ status: 'ok', db: rows[0].time });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── API: Categorías ──────────────────────────────────────────
app.get('/api/categories', optionalAuth, async (_req, res) => {
  const { rows } = await getPool().query(`
    SELECT c.*, COUNT(p.id)::int as "productCount"
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    GROUP BY c.id
    ORDER BY c.id
  `);
  res.json(rows);
});

app.post('/api/categories', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const { rows } = await getPool().query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
    [name]
  );
  res.status(201).json(rows[0]);
});

app.put('/api/categories/:id', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  const { name } = req.body;
  const { rows: updated } = await getPool().query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name || rows[0].name, req.params.id]
  );
  res.json(updated[0]);
});

app.delete('/api/categories/:id', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  await getPool().query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ message: 'Categoría eliminada' });
});

// ── API: Productos ────────────────────────────────────────────
app.get('/api/products', optionalAuth, async (req, res) => {
  const { is_active } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];
  if (is_active !== undefined) {
    sql += ' WHERE is_active = $1';
    params.push(Number(is_active));
  }
  sql += ' ORDER BY id';
  const { rows } = await getPool().query(sql, params);
  res.json(rows);
});

app.get('/api/products/:id', optionalAuth, async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(rows[0]);
});

app.post('/api/products', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { name, category_id, price, offer_price, stock, description, image_url } = req.body;
  if (!name || !category_id || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const { rows } = await getPool().query(
    'INSERT INTO products (name, category_id, price, offer_price, stock, description, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [name, category_id, price, offer_price ?? null, stock, description ?? '', image_url ?? '']
  );
  res.status(201).json(rows[0]);
});

app.put('/api/products/:id', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { rows: existing } = await getPool().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Producto no encontrado' });
  const { name, category_id, price, offer_price, stock, description, image_url, is_active } = req.body;
  const { rows: updated } = await getPool().query(`
    UPDATE products SET
      name = COALESCE($1, name),
      category_id = COALESCE($2, category_id),
      price = COALESCE($3, price),
      offer_price = $4,
      stock = COALESCE($5, stock),
      description = COALESCE($6, description),
      image_url = COALESCE($7, image_url),
      is_active = COALESCE($8, is_active)
    WHERE id = $9 RETURNING *
  `, [
    name ?? null, category_id ?? null, price ?? null,
    offer_price !== undefined ? offer_price : null,
    stock ?? null, description ?? null, image_url ?? null,
    is_active ?? null, req.params.id,
  ]);
  res.json(updated[0]);
});

app.delete('/api/products/:id', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
  await getPool().query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ message: 'Producto eliminado' });
});

// ── API: Pedidos ──────────────────────────────────────────────
app.get('/api/orders', requireAuth, async (req, res) => {
  const { user_id } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  if (user_id) {
    sql += ' WHERE user_id = $1';
    params.push(Number(user_id));
  }
  sql += ' ORDER BY id DESC';
  const { rows: orders } = await getPool().query(sql, params);
  for (const order of orders) {
    const { rows: items } = await getPool().query('SELECT * FROM order_details WHERE order_id = $1', [order.id]);
    order.items = items;
  }
  res.json(orders);
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
  const { rows: items } = await getPool().query('SELECT * FROM order_details WHERE order_id = $1', [req.params.id]);
  rows[0].items = items;
  res.json(rows[0]);
});

app.post('/api/orders', requireAuth, async (req, res) => {
  const { user_id, user_name, items, delivery_address, delivery_cost } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
  const total_amount = items.reduce((sum, i) => sum + i.price * i.quantity, 0) + (delivery_cost || 0);
  const cost = delivery_cost || 0;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query(
      'INSERT INTO orders (user_id, user_name, total_amount, delivery_address, delivery_cost, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [user_id ?? null, user_name ?? 'Cliente', total_amount, delivery_address ?? '', cost, 'pendiente']
    );
    const orderId = orderRows[0].id;
    for (const item of items) {
      await client.query(
        'INSERT INTO order_details (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );
    }
    await client.query('COMMIT');
    const { rows: details } = await client.query('SELECT * FROM order_details WHERE order_id = $1', [orderId]);
    orderRows[0].items = details;
    res.status(201).json(orderRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Error al crear el pedido' });
  } finally {
    client.release();
  }
});

app.put('/api/orders/:id/status', requireAuth, requireRole('admin', 'empleado'), async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
  const { status } = req.body;
  const validStatuses = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
  const { rows: updated } = await getPool().query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  const { rows: details } = await getPool().query('SELECT * FROM order_details WHERE order_id = $1', [req.params.id]);
  updated[0].items = details;
  res.json(updated[0]);
});

// ── API: Dashboard ────────────────────────────────────────────
app.get('/api/dashboard/summary', requireAuth, requireRole('admin', 'empleado'), async (_req, res, next) => {
  const client = await getPool().connect();
  try {
    const ventasHoy = (await client.query(
      "SELECT COUNT(*)::int as count FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelado'"
    )).rows[0].count;
    const ingresosTotales = (await client.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelado'"
    )).rows[0].total;
    const pedidosActivos = (await client.query(
      "SELECT COUNT(*)::int as count FROM orders WHERE status IN ('pendiente', 'confirmado', 'enviado')"
    )).rows[0].count;
    const productosVendidos = (await client.query(`
      SELECT COALESCE(SUM(od.quantity), 0)::int as total
      FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE o.status != 'cancelado'
    `)).rows[0].total;
    const totalPedidos = (await client.query('SELECT COUNT(*)::int as count FROM orders')).rows[0].count;
    res.json({ ventasHoy, ingresosTotales, pedidosActivos, productosVendidos, totalPedidos });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

app.get('/api/dashboard/sales-by-month', requireAuth, requireRole('admin', 'empleado'), async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const { rows } = await getPool().query(`
      SELECT EXTRACT(MONTH FROM created_at)::int as mes,
             COALESCE(SUM(total_amount), 0) as cantidad,
             COUNT(*)::int as pedidos
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1 AND status != 'cancelado'
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY mes
    `, [String(year)]);

    const fullYear = Array.from({ length: 12 }, (_, i) => {
      const found = rows.find((r) => r.mes === i + 1);
      return { mes: i + 1, cantidad: found ? Number(found.cantidad) : 0, pedidos: found ? found.pedidos : 0 };
    });
    res.json(fullYear);
  } catch (err) {
    next(err);
  }
});

app.get('/api/dashboard/recent-orders', requireAuth, requireRole('admin', 'empleado'), async (_req, res, next) => {
  try {
    const { rows: orders } = await getPool().query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'
    );
    for (const order of orders) {
      const { rows: items } = await getPool().query('SELECT * FROM order_details WHERE order_id = $1', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ── Error handler global ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ── Iniciar servidor (local) / Exportar (Vercel) ──────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.API_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
