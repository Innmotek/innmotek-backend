/**
 * Innmotek V2 - Storage & Asset URL Configuration
 * Rewrites media URLs to the local Render /tmp/ cached media streaming route
 * to eliminate raw Supabase Storage egress.
 */

require('dotenv').config();

/**
 * Build the public URL for an asset filename.
 * 
 * @param {string} folder - Asset subfolder/bucket (e.g. 'products', 'categories', 'banners')
 * @param {string|null} filename - Stored image filename (e.g. 'uuid.webp')
 * @returns {string|null} Full cached proxy image URL or null if filename is empty
 */
function getImageUrl(folder, filename) {
  if (!filename || typeof filename !== 'string' || filename.trim() === '') {
    return null;
  }
  
  let cleanFilename = filename.trim();

  // Rewrite raw Supabase URLs to cached proxy route
  if (cleanFilename.includes('supabase.co')) {
    cleanFilename = cleanFilename.split('/').pop().split('?')[0];
  }

  // If already an external absolute URL (non-supabase), return as-is
  if (cleanFilename.startsWith('http://') || cleanFilename.startsWith('https://')) {
    return cleanFilename;
  }

  const port = process.env.PORT || 5000;
  const host = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/+$/, '');
  return `${host}/api/media/${folder}/${cleanFilename}`;
}

module.exports = {
  getImageUrl
};
