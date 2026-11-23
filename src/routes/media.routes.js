const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const CACHE_DIR = process.env.MEDIA_CACHE_DIR || path.join(os.tmpdir(), 'innmotek_media_cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[InnmotekMedia] Could not initialize cache directory:', err.message);
  }
}

let supabase = null;
function getSupabase() {
  if (!supabase) {
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
      );
    }
  }
  return supabase;
}

const MIME_MAP = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  pdf: 'application/pdf',
  ico: 'image/x-icon'
};

function getMime(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function generateETag(buffer) {
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  return `"${buffer.length.toString(16)}-${hash.substring(0, 16)}"`;
}

function getFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      return fs.readFileSync(cachePath);
    } catch {
      return null;
    }
  }
  return null;
}

function saveToDiskCache(filename, buffer) {
  const cachePath = path.join(CACHE_DIR, filename);
  try {
    fs.writeFileSync(cachePath, buffer);
  } catch (err) {
    console.warn('[InnmotekMedia] Disk cache write failed:', err.message);
  }
}

function removeFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
    } catch {}
  }
}

function serveMediaResponse(req, res, filename, buffer, cacheHit = false) {
  const etag = generateETag(buffer);
  res.setHeader('Content-Type', getMime(filename));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  res.setHeader('X-Media-Cache', cacheHit ? 'HIT-DISK' : 'MISS-SUPABASE');

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  return res.send(buffer);
}

/**
 * Streaming media endpoint with Render /tmp/ local SSD disk cache & HTTP 304 conditional revalidation
 * GET /api/media/:bucketOrFolder/:filename
 */
router.get('/:bucket/:filename', async (req, res) => {
  const { bucket, filename } = req.params;

  if (!filename || filename === 'null' || filename === 'undefined' || filename.includes('..')) {
    return res.status(404).send('Media not found');
  }

  // 1. FAST PATH: Check Render local SSD disk cache
  const cached = getFromDiskCache(filename);
  if (cached) {
    return serveMediaResponse(req, res, filename, cached, true);
  }

  // 2. Fallback check: check local legacy asset path if available
  const localLegacy = path.resolve(__dirname, '../../../innotek-backend-OLD/public/frontend/images', bucket, filename);
  if (fs.existsSync(localLegacy)) {
    try {
      const buffer = fs.readFileSync(localLegacy);
      saveToDiskCache(filename, buffer);
      return serveMediaResponse(req, res, filename, buffer, false);
    } catch {}
  }

  // 3. COLD MISS: Download once from Supabase Storage
  const client = getSupabase();
  if (!client) {
    return res.status(404).send('Storage provider not configured.');
  }

  try {
    // Try bucket directly, or main bucket with folder prefix
    const mainBucket = process.env.SUPABASE_BUCKET || 'innmotek-media';
    let downloadRes = await client.storage.from(bucket).download(filename);
    if (downloadRes.error || !downloadRes.data) {
      downloadRes = await client.storage.from(mainBucket).download(`${bucket}/${filename}`);
    }

    if (downloadRes.error || !downloadRes.data) {
      return res.status(404).send(`Asset "${filename}" not found in storage.`);
    }

    const arrayBuffer = await downloadRes.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    saveToDiskCache(filename, buffer);

    return serveMediaResponse(req, res, filename, buffer, false);
  } catch (err) {
    console.error('[InnmotekMedia] Error streaming media:', err.message);
    return res.status(500).send('Internal media serving error');
  }
});

module.exports = {
  router,
  saveToDiskCache,
  removeFromDiskCache,
  CACHE_DIR
};
