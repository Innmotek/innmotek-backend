/**
 * Innmotek V2 - Image Upload & WEBP Conversion Helper with Context Presets & Local Disk Pre-Caching
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const { getImageUrl } = require('../config/storage');
const { saveToDiskCache, removeFromDiskCache } = require('../routes/media.routes');
const db = require('../config/database');

const FOLDER_PRESETS = {
  brands: { width: 400, height: 400, quality: 85 },
  categories: { width: 600, height: 600, quality: 80 },
  services: { width: 600, height: 600, quality: 80 },
  testimonials: { width: 400, height: 400, quality: 80 },
  products: { width: 1200, height: 1200, quality: 80 },
  projects: { width: 1200, height: 1200, quality: 80 },
  blogs: { width: 1200, height: 800, quality: 80 },
  banners: { width: 1600, height: 900, quality: 80 },
  catalogues: { width: 1200, height: 1200, quality: 80 }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are permitted'), false);
    }
  }
});

let supabase = null;
function getSupabaseClient() {
  if (!supabase && process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    );
  }
  return supabase;
}

/**
 * Save image buffer as compressed WEBP with context-aware sizing presets.
 * Immediately pre-caches to Render /tmp/ disk cache to eliminate Supabase egress on read.
 */
async function processAndSaveWebp(buffer, folder = 'products') {
  const filename = `${crypto.randomUUID()}.webp`;
  const preset = FOLDER_PRESETS[folder] || FOLDER_PRESETS.products;

  // Compress and convert to WEBP with sharp enforcing context-aware dimension presets
  const webpBuffer = await sharp(buffer)
    .rotate() // Auto-orient based on EXIF and strip metadata
    .resize({
      width: preset.width,
      height: preset.height,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: preset.quality, effort: 4 })
    .toBuffer();

  // 1. Immediately pre-cache to Render local SSD disk cache
  saveToDiskCache(filename, webpBuffer);

  // 2. Also keep local legacy copy if directory exists
  try {
    const targetDir = path.resolve(__dirname, '../../../innotek-backend-OLD/public/frontend/images', folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, filename), webpBuffer);
  } catch {}

  // 3. Upload to Supabase Storage
  const client = getSupabaseClient();
  if (client) {
    try {
      const mainBucket = process.env.SUPABASE_BUCKET || 'innmotek-media';
      const { error } = await client.storage.from(mainBucket).upload(`${folder}/${filename}`, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
      if (error) {
        // Fallback try folder name as bucket
        await client.storage.from(folder).upload(filename, webpBuffer, {
          contentType: 'image/webp',
          upsert: true
        });
      }
    } catch (e) {
      console.warn(`[upload.helper] Supabase sync upload skipped:`, e.message);
    }
  }

  return {
    filename,
    url: getImageUrl(folder, filename)
  };
}

/**
 * Process base64 data URI to compressed WEBP with presets.
 */
async function processBase64Webp(base64Data, folder = 'products') {
  if (!base64Data || typeof base64Data !== 'string') return null;

  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  const rawBase64 = matches ? matches[2] : base64Data;
  const buffer = Buffer.from(rawBase64, 'base64');

  return await processAndSaveWebp(buffer, folder);
}

/**
 * Process document (PDF, etc.) and pre-cache to disk.
 */
async function processBase64Document(base64Data, originalName = 'document.pdf', folder = 'catalogues') {
  if (!base64Data || typeof base64Data !== 'string') return null;

  let mimeType = 'application/pdf';
  let ext = 'pdf';
  if (originalName && originalName.includes('.')) {
    ext = originalName.split('.').pop().toLowerCase();
  }

  const mimeMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  let rawBase64 = base64Data;
  if (mimeMatch) {
    mimeType = mimeMatch[1];
    rawBase64 = mimeMatch[2];
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  const filename = `${crypto.randomUUID()}.${ext}`;

  saveToDiskCache(filename, buffer);

  const client = getSupabaseClient();
  if (client) {
    try {
      const mainBucket = process.env.SUPABASE_BUCKET || 'innmotek-media';
      await client.storage.from(mainBucket).upload(`${folder}/${filename}`, buffer, {
        contentType: mimeType,
        upsert: true
      });
    } catch (e) {
      console.warn(`[upload.helper] Supabase document upload skipped:`, e.message);
    }
  }

  return {
    filename,
    url: getImageUrl(folder, filename)
  };
}

/**
 * Purge asset from Supabase Storage and unlink local disk cache
 */
async function deleteFromStorage(folder, filename) {
  if (!filename) return;
  const cleanFilename = filename.split('/').pop().split('?')[0];
  if (!cleanFilename) return;

  removeFromDiskCache(cleanFilename);

  const client = getSupabaseClient();
  if (client) {
    try {
      const mainBucket = process.env.SUPABASE_BUCKET || 'innmotek-media';
      await client.storage.from(mainBucket).remove([`${folder}/${cleanFilename}`]);
      await client.storage.from(folder).remove([cleanFilename]);
    } catch (err) {
      console.warn('[upload.helper] Failed to remove from Supabase:', err.message);
    }
  }
}

/**
 * Maintenance routine: cleans unreferenced orphan files across Supabase Storage
 */
async function cleanSupabaseOrphans() {
  console.log('[Innmotek] Running storage orphan cleanup...');
  const activeFiles = new Set();

  const registerActive = (fn) => {
    if (!fn || typeof fn !== 'string') return;
    const clean = fn.split('/').pop().split('?')[0].trim();
    if (clean && clean.length > 3) activeFiles.add(clean);
  };

  const tables = ['categories', 'products', 'banners', 'blogs', 'brands', 'services', 'projects', 'testimonials', 'pages'];
  for (const tbl of tables) {
    try {
      const rows = db.table(tbl).all();
      (rows || []).forEach(r => {
        registerActive(r.image);
        registerActive(r.download);
        registerActive(r.icon);
      });
    } catch {}
  }

  // Also check images table for product gallery
  try {
    const gallery = db.table('images').all();
    (gallery || []).forEach(g => registerActive(g.filename || g.image));
  } catch {}

  const client = getSupabaseClient();
  const report = {
    activeFilesFound: activeFiles.size,
    purgedCount: 0,
    purgedFiles: [],
    errors: []
  };

  if (!client) {
    report.errors.push('Supabase client not configured');
    return report;
  }

  const mainBucket = process.env.SUPABASE_BUCKET || 'innmotek-media';
  for (const folder of tables) {
    try {
      const { data: files, error } = await client.storage.from(mainBucket).list(folder, { limit: 1000 });
      if (error) continue;

      const orphans = (files || [])
        .filter(f => f.name && !f.name.startsWith('.') && !activeFiles.has(f.name))
        .map(f => `${folder}/${f.name}`);

      if (orphans.length > 0) {
        await client.storage.from(mainBucket).remove(orphans);
        report.purgedCount += orphans.length;
        report.purgedFiles.push(...orphans);
        orphans.forEach(p => removeFromDiskCache(p.split('/').pop()));
      }
    } catch (err) {
      report.errors.push(`Error on ${folder}: ${err.message}`);
    }
  }

  return report;
}

module.exports = {
  upload,
  processAndSaveWebp,
  processBase64Webp,
  processBase64Document,
  deleteFromStorage,
  cleanSupabaseOrphans
};
