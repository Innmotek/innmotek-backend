/**
 * Innmotek V2 - Product Serialization Helper
 * 
 * Replaces Laravel Helper functions:
 * - get_api_products() (app/Helpers/frontendManageApi.php:212)
 * - get_api_frontend_product() (app/Helpers/frontendManageApi.php:232)
 * - get_api_product_images() (app/Helpers/ecommerceManageApi.php:4)
 * - get_api_featured_products() (app/Helpers/frontendManageApi.php:379)
 * 
 * Logic & Response Shape Matching:
 * - Builds product summaries with image URLs
 * - Builds full product specifications with gallery images from the `images` table
 */

const { getImageUrl } = require('../config/storage');
const db = require('../config/database');

/**
 * Format a list of products for category/catalogue grid displays.
 * 
 * @param {Array} products - Array of product records
 * @returns {Array} List of formatted products matching API_SPEC.md exactly
 */
function formatProductList(products) {
  if (!Array.isArray(products)) return [];

  return products.map(product => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    summary: product.summary || null,
    image: getImageUrl('products', product.image)
  }));
}

/**
 * Format detailed product profile with full specifications and gallery images.
 * 
 * @param {object} product - Product database record
 * @returns {object|null} Detailed product object
 */
function formatProductDetail(product) {
  if (!product) return null;

  // Retrieve gallery images for this product from the images table
  const galleryImages = db.table('images')
    .where('product_id', product.id)
    .get();

  const formattedGallery = galleryImages.map(img => ({
    id: img.id,
    image: getImageUrl('products', img.filename),
    slug: img.slug || product.slug
  }));

  // Lookup category information for breadcrumbs and navigation
  let categoryInfo = null;
  if (product.category_id) {
    const cat = db.table('categories').find(product.category_id);
    if (cat) {
      categoryInfo = {
        id: cat.id,
        title: cat.title,
        slug: cat.slug
      };
    }
  }

  return {
    slug: product.slug,
    title: product.title,
    category: categoryInfo,
    description: product.description || null,
    summary: product.summary || null,
    warrenty: product.warrenty || null,
    specification: product.specification || null,
    installation: product.installation || null,
    download: product.download || null,
    image: getImageUrl('products', product.image),
    seo_title: product.seo_title || null,
    seo_keyword: product.seo_keyword || null,
    seo_description: product.seo_description || null,
    images: formattedGallery
  };
}

/**
 * Format featured products list.
 * 
 * @param {Array} products - Array of featured product records
 * @returns {Array} List of featured products with navigation slug
 */
function formatFeaturedProducts(products) {
  if (!Array.isArray(products)) return [];

  return products.map(item => {
    // Return clean slug without redundant /products/ prefix
    let cleanSlug = (item.slug || '').replace(/^\/+products\/+/, '').replace(/^\/+/, '');
    let slug = cleanSlug;
    if (item.title === 'Full Inverter Dehumidify360' || item.slug === 'dehumidifier') {
      slug = 'dehumidifier';
    } else if (item.title === 'Wireless Robotic Pool cleaner' || item.slug === 'robotic-pool-cleaner') {
      slug = 'robotic-pool-cleaner';
    }

    return {
      title: item.title,
      slug,
      summary: item.summary || null,
      image: getImageUrl('products', item.image)
    };
  });
}

module.exports = {
  formatProductList,
  formatProductDetail,
  formatFeaturedProducts
};
