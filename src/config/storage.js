/**
 * Innmotek V2 - Storage & Asset URL Configuration
 * 
 * Replaces Laravel's asset() / Eloquent getImageUrlAttribute accessors.
 * 
 * STRATEGY:
 * - Default: Local storage via Express static server (http://localhost:<PORT>/frontend/images/<folder>/<filename>).
 * - Supabase Storage: When STORAGE_BASE_URL is configured in .env, generates public CDN URLs (https://<project-ref>.supabase.co/storage/v1/object/public/<folder>/<filename>).
 * - SECURITY RULE: Zero hardcoded third-party domains, Supabase URLs, or credentials in source code.
 */

require('dotenv').config();

/**
 * Build the public URL for an asset filename.
 * 
 * @param {string} folder - Asset subfolder/bucket (e.g. 'products', 'categories', 'banners')
 * @param {string|null} filename - Stored image filename (e.g. 'uuid.webp')
 * @returns {string|null} Full image URL or null if filename is empty
 */
function getImageUrl(folder, filename) {
  if (!filename || typeof filename !== 'string' || filename.trim() === '') {
    return null;
  }
  
  const cleanFilename = filename.trim();

  // If already an absolute URL (http/https), return as-is
  if (cleanFilename.startsWith('http://') || cleanFilename.startsWith('https://')) {
    return cleanFilename;
  }

  // If an external storage base URL is explicitly provided in .env (e.g. Supabase Storage public URL)
  if (process.env.STORAGE_BASE_URL && process.env.STORAGE_BASE_URL.trim() !== '') {
    const base = process.env.STORAGE_BASE_URL.trim().replace(/\/+$/, '');
    return `${base}/${folder}/${cleanFilename}`;
  }

  // Default: Local development server URL
  const port = process.env.PORT || 5000;
  const host = process.env.APP_URL || `http://localhost:${port}`;
  return `${host.replace(/\/+$/, '')}/frontend/images/${folder}/${cleanFilename}`;
}

module.exports = {
  getImageUrl
};
