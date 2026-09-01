/**
 * Innmotek V2 - Blog Serialization Helper
 * 
 * Replaces Laravel Helper functions:
 * - get_api_blogs() (app/Helpers/frontendManageApi.php:81)
 * - get_api_blog() (app/Helpers/frontendManageApi.php:102)
 * - get_api_blog_categories() (app/Helpers/frontendManageApi.php:120)
 * - get_api_blog_category() (app/Helpers/frontendManageApi.php:138)
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { formatDate } = require('./date.helper');

/**
 * Format a list of blog summaries.
 * 
 * @param {Array} blogs - Array of blog database records
 * @returns {Array} Formatted blog list matching API_SPEC.md exactly
 */
function formatBlogList(blogs) {
  if (!Array.isArray(blogs)) return [];

  return blogs.map(blog => {
    let categoryTitle = null;
    if (blog.category_id) {
      const cat = db.table('blog_categories').find(blog.category_id);
      if (cat) categoryTitle = cat.title;
    }

    return {
      slug: blog.slug,
      title: blog.title,
      summary: blog.summary || null,
      image: getImageUrl('blogs', blog.image),
      category: categoryTitle,
      date: formatDate(blog.created_at)
    };
  });
}

/**
 * Format a single blog post reader payload.
 * 
 * @param {object} blog - Blog database record
 * @returns {object|null} Detailed blog reader object
 */
function formatBlogDetail(blog) {
  if (!blog) return null;

  let categoryTitle = null;
  let categorySlug = null;

  if (blog.category_id) {
    const cat = db.table('blog_categories').find(blog.category_id);
    if (cat) {
      categoryTitle = cat.title;
      categorySlug = cat.slug;
    }
  }

  return {
    slug: blog.slug,
    title: blog.title,
    summary: blog.summary || null,
    category: categoryTitle,
    category_slug: categorySlug,
    description: blog.description || null,
    image: getImageUrl('blogs', blog.image),
    date: formatDate(blog.created_at)
  };
}

/**
 * Format list of blog categories.
 * 
 * @param {Array} categories - Array of blog category records
 * @returns {Array} List of blog categories
 */
function formatBlogCategories(categories) {
  if (!Array.isArray(categories)) return [];

  return categories.map(cat => ({
    title: cat.title,
    slug: cat.slug
  }));
}

/**
 * Format single blog category object.
 * 
 * @param {object} cat - Blog category record
 * @returns {object} Formatted category object
 */
function formatBlogCategoryDetail(cat) {
  if (!cat) return null;

  return {
    title: cat.title,
    slug: cat.slug,
    products: 0 // Retained for exact backwards compatibility with frontend consumption
  };
}

module.exports = {
  formatBlogList,
  formatBlogDetail,
  formatBlogCategories,
  formatBlogCategoryDetail
};
