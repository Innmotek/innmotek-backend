/**
 * Innmotek Slug Generator Helper
 * Replaces external slugify package with standard zero-dependency regex
 */

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word characters except dashes
    .replace(/[\s_-]+/g, '-')  // collapse spaces and underscores into single dash
    .replace(/^-+|-+$/g, '');  // trim leading/trailing dashes
}

module.exports = { slugify };
