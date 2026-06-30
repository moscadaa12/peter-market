import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let supabase;
let bucketReady = false;
const BUCKET = 'products';

function getClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

function isAvailable() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

async function ensureBucket() {
  if (bucketReady || !getClient()) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5 * 1024 * 1024,
    });
  }
  bucketReady = true;
}

export async function uploadBuffer(buffer, fileName, contentType) {
  if (!isAvailable()) return `/images/products/${fileName}`;
  const client = getClient();
  await ensureBucket();
  const { error } = await client.storage.from(BUCKET).upload(fileName, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }
  const { data: { publicUrl } } = client.storage.from(BUCKET).getPublicUrl(fileName);
  return publicUrl;
}

export async function uploadFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mime = ext === '.jpg' ? 'image/jpeg' : `image/${ext.slice(1)}`;
  return uploadBuffer(buffer, fileName, mime);
}

export async function seedAllImages() {
  if (!isAvailable()) return {};
  const client = getClient();
  await ensureBucket();

  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products');
  if (!fs.existsSync(imagesDir)) return {};

  const files = fs.readdirSync(imagesDir).filter((f) => /\.(webp|jpe?g|png|gif)$/i.test(f));
  if (!files.length) return {};

  const { data: existing } = await client.storage.from(BUCKET).list();
  const uploaded = new Set(existing?.map((f) => f.name) || []);
  const urlMap = {};

  for (const file of files) {
    if (!uploaded.has(file)) {
      const fpath = path.join(imagesDir, file);
      const buffer = fs.readFileSync(fpath);
      const ext = path.extname(file).toLowerCase();
      const mime = ext === '.jpg' ? 'image/jpeg' : `image/${ext.slice(1)}`;
      const { error } = await client.storage.from(BUCKET).upload(file, buffer, {
        contentType: mime,
        upsert: true,
      });
      if (error) console.error(`Seed upload error (${file}):`, error.message);
    }
    const { data: { publicUrl } } = client.storage.from(BUCKET).getPublicUrl(file);
    urlMap[file] = publicUrl;
  }

  return urlMap;
}
