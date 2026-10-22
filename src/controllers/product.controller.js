/**
 * Innmotek V2 - Product Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Product\ProductController
 * 
 * Routes Handled:
 *   - GET /api/products/:category -> index()
 *   - GET /api/products/:product/show -> show()
 *   - GET /api/products/:product -> show() (alias for frontend compatibility)
 * 
 * Behavior & Bug Fixes vs Original Laravel Code:
 * 1. Safely handles missing/orphan product category relationships without throwing runtime errors.
 * 2. Properly excludes current product from related products list (`products.except(product.id)`).
 * 3. Exact field and wrapper match against API_SPEC.md.
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');
const { formatCategoryDetail } = require('../helpers/category.helper');
const { formatProductList, formatProductDetail } = require('../helpers/product.helper');

/**
 * List all products for a given category.
 * 
 * Route: GET /api/products/:category (category slug or ID)
 */
function index(req, res) {
  try {
    const categoryParam = req.params.category;

    const category = db.table('categories')
      .where('slug', categoryParam)
      .first() || db.table('categories').find(categoryParam);

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const products = db.table('products')
      .where('category_id', category.id)
      .where('status', 1)
      .orderBy('title', 'asc')
      .get();

    const formattedProducts = formatProductList(products);
    const categoryDetail = formatCategoryDetail(category);

    return sendSuccess(res, {
      products: formattedProducts,
      category: categoryDetail
    });
  } catch (error) {
    console.error('[ProductController@index] Error:', error);
    return sendError(res, 'Failed to fetch products for category', 500);
  }
}

/**
 * Show single product specifications, gallery images, and related equipment.
 * 
 * Route: GET /api/products/:product/show
 */
function show(req, res) {
  try {
    const productParam = req.params.product;

    // Find product by slug or id
    const product = db.table('products')
      .where('slug', productParam)
      .first() || db.table('products').find(productParam);

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Find sibling/related products in the same category branch
    let relatedProducts = [];
    if (product.category_id) {
      const childCategories = db.table('categories')
        .where('parent_category', product.category_id)
        .pluck('id');

      const targetCategoryIds = [product.category_id, ...childCategories];

      relatedProducts = db.table('products')
        .whereIn('category_id', targetCategoryIds)
        .where('status', 1)
        .orderBy('title', 'asc')
        .get()
        .filter(p => p.id !== product.id); // Exclude the current active product
    }

    const formattedProduct = formatProductDetail(product);
    const formattedRelated = formatProductList(relatedProducts);

    return sendSuccess(res, {
      product: formattedProduct,
      products: formattedRelated
    });
  } catch (error) {
    console.error('[ProductController@show] Error:', error);
    return sendError(res, 'Failed to fetch product detail', 500);
  }
}

/**
 * List all active products across all categories.
 * 
 * Route: GET /api/products
 */
function all(req, res) {
  try {
    const products = db.table('products')
      .where('status', 1)
      .orderBy('title', 'asc')
      .get();

    const formattedProducts = formatProductList(products);

    return sendSuccess(res, {
      products: formattedProducts
    });
  } catch (error) {
    console.error('[ProductController@all] Error:', error);
    return sendError(res, 'Failed to fetch all products', 500);
  }
}

module.exports = {
  index,
  show,
  all
};

