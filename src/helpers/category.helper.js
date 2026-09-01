/**
 * Innmotek V2 - Category Serialization Helper
 * 
 * Replaces Laravel Helper functions:
 * - get_api_categories() (app/Helpers/frontendManageApi.php:23)
 * - get_api_subCategory() (app/Helpers/frontendManageApi.php:43)
 * - get_api_childCategory() (app/Helpers/frontendManageApi.php:62)
 * 
 * Logic & Response Shape Matching:
 * - Builds recursive category trees with count of child subcategories
 * - Builds full image URLs via getImageUrl('categories', image)
 */

const { getImageUrl } = require('../config/storage');
const db = require('../config/database');

/**
 * Format a list of root categories with their nested child category tree.
 * 
 * @param {Array} rootCategories - Array of top-level category records
 * @returns {Array} Formatted category tree matching API_SPEC.md exactly
 */
function formatCategoryTree(rootCategories) {
  if (!Array.isArray(rootCategories)) return [];

  return rootCategories.map(cat => {
    // Find all direct child categories
    const subCategories = db.table('categories')
      .where('parent_category', cat.id)
      .where('status', 1)
      .orderBy('order', 'asc')
      .get();

    return {
      slug: cat.slug,
      title: cat.title,
      image: getImageUrl('categories', cat.image),
      categories: subCategories.length,
      subCategory: formatSubCategories(subCategories)
    };
  });
}

/**
 * Recursively format subcategories and their children.
 * 
 * @param {Array} subCategories - Array of subcategory records
 * @returns {Array} Nested subcategories with childCategory arrays
 */
function formatSubCategories(subCategories) {
  if (!Array.isArray(subCategories)) return [];

  return subCategories.map(subCat => {
    const childCategories = db.table('categories')
      .where('parent_category', subCat.id)
      .where('status', 1)
      .orderBy('order', 'asc')
      .get();

    return {
      slug: subCat.slug,
      title: subCat.title,
      categories: childCategories.length,
      childCategory: formatSubCategories(childCategories)
    };
  });
}

/**
 * Format a category detail item (for show routes).
 * 
 * @param {object} category - Category database record
 * @returns {object} Category metadata object
 */
function formatCategoryDetail(category) {
  if (!category) return null;

  let parentLink = '#';
  let parentTitle = null;

  if (category.parent_category) {
    const parent = db.table('categories').find(category.parent_category);
    if (parent) {
      parentLink = parent.slug;
      parentTitle = parent.title;
    }
  }

  return {
    slug: category.slug,
    title: category.title,
    parentLink,
    parentTitle,
    seo_title: category.seo_title || null,
    seo_keyword: category.seo_keyword || null,
    seo_description: category.seo_description || null
  };
}

module.exports = {
  formatCategoryTree,
  formatSubCategories,
  formatCategoryDetail
};
