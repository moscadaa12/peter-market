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
