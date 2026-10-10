/**
 * Innmotek V2 - Image Upload & WEBP Conversion Helper
 * 
 * Pipeline:
 * 1. Multer receives multipart image files in-memory (RAM buffer)
 * 2. Sharp processes the image buffer, optimizes it, and compresses to modern WEBP format (quality: 85)
 * 3. File is saved with a unique UUID filename ({uuid}.webp) in the designated storage folder
 * 4. Returns the generated filename and fully qualified asset URL
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const { getImageUrl } = require('../config/storage');

// Memory storage for fast in-RAM stream processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted'), false);
    }
  }
});

/**
 * Save image buffer as compressed WEBP.
 * 
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} folder - Target folder name (e.g. 'products', 'categories')
 * @returns {Promise<{ filename: string, url: string }>}
 */
async function processAndSaveWebp(buffer, folder = 'products') {
  const targetDir = path.resolve(__dirname, '../../../innotek-backend-OLD/public/frontend/images', folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const filePath = path.join(targetDir, filename);

  // Compress and convert to WEBP with sharp
  const webpBuffer = await sharp(buffer)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  fs.writeFileSync(filePath, webpBuffer);

  // If Supabase Storage is configured, sync upload
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase.storage.from(folder).upload(filename, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
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
 * Process base64 data URI to compressed WEBP.
 * 
 * @param {string} base64Data - Data URI or raw base64 string
 * @param {string} folder - Target folder name
 * @returns {Promise<{ filename: string, url: string }|null>}
 */
async function processBase64Webp(base64Data, folder = 'products') {
  if (!base64Data || typeof base64Data !== 'string') return null;

  // Extract base64 payload if data URI prefix exists
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  const rawBase64 = matches ? matches[2] : base64Data;
  const buffer = Buffer.from(rawBase64, 'base64');

  return await processAndSaveWebp(buffer, folder);
}

module.exports = {
  upload,
  processAndSaveWebp,
  processBase64Webp
};
