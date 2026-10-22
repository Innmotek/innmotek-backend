/**
 * Innmotek V2 - Category Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Category\CategoryController
 * 
 * Routes Handled:
 *   - GET /api/categories -> index()
 *   - GET /api/category/:category -> show()
 *   - GET /api/products/related/:category -> related()
 * 
 * Behavior & Bug Fixes vs Original Laravel Code:
 * 1. Fixed whereIn(Model) bug in related(): Original Laravel code did
 *    `Category::whereIn('parent_category', $category)` which passed the entire model object
 *    to MySQL. In this implementation, we query children by `parent_category = category.id`.
 * 2. Matches exact API_SPEC.md response shape: {"result": "success", "categories": [...]}
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');
const { formatCategoryTree, formatCategoryDetail } = require('../helpers/category.helper');
const { formatProductList } = require('../helpers/product.helper');

/**
 * List all root categories with nested subcategory trees.
 * 
 * Route: GET /api/categories
 */
function index(req, res) {
  try {
    const rootCategories = db.table('categories')
      .whereNull('parent_category')
      .where('status', 1)
      .orderBy('order', 'asc')
      .get();

    const formattedCategories = formatCategoryTree(rootCategories);

    return sendSuccess(res, 'categories', formattedCategories);
  } catch (error) {
    console.error('[CategoryController@index] Error:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
}

/**
 * Show direct subcategories and metadata for a given category.
 * 
 * Route: GET /api/category/:category (category slug or ID)
 */
function show(req, res) {
  try {
    const categoryParam = req.params.category;

    // Find category by slug or id
    const category = db.table('categories')
      .where('slug', categoryParam)
      .first() || db.table('categories').find(categoryParam);

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    // Get direct child categories
    const subCategories = db.table('categories')
      .where('parent_category', category.id)
      .where('status', 1)
      .orderBy('id', 'asc')
      .get();

    const categoryList = subCategories.map(item => {
      const childCount = db.table('categories')
        .where('parent_category', item.id)
        .where('status', 1)
        .count();

      return {
        slug: item.slug,
        title: item.title,
        image: getImageUrl('categories', item.image),
        description: item.description || null,
        categories: childCount
      };
    });

    const categoryDetail = formatCategoryDetail(category);

    return sendSuccess(res, {
      categories: categoryList,
      category: categoryDetail
    });
  } catch (error) {
    console.error('[CategoryController@show] Error:', error);
    return sendError(res, 'Failed to fetch category details', 500);
  }
}

/**
 * Get products related to a category (products belonging to its subcategories).
 * 
 * Route: GET /api/products/related/:category
 */
function related(req, res) {
  try {
    const categoryParam = req.params.category;

    const category = db.table('categories')
      .where('slug', categoryParam)
      .first() || db.table('categories').find(categoryParam);

    if (!category) {
      return sendSuccess(res, 'products', []);
    }

    // BUG FIX vs Laravel: Query child categories properly using category.id
    const childCategoryIds = db.table('categories')
      .where('parent_category', category.id)
      .pluck('id');

    // Also include the category itself if no children exist
    const targetCategoryIds = childCategoryIds.length > 0 ? childCategoryIds : [category.id];

    const products = db.table('products')
      .whereIn('category_id', targetCategoryIds)
      .where('status', 1)
      .orderBy('title', 'asc')
      .get();

    const formattedProducts = formatProductList(products);

    return sendSuccess(res, 'products', formattedProducts);
  } catch (error) {
    console.error('[CategoryController@related] Error:', error);
    return sendError(res, 'Failed to fetch related products', 500);
  }
}

/**
 * List all active categories flat (for dynamic sitemaps and indexing).
 * 
 * Route: GET /api/categories/all
 */
function all(req, res) {
  try {
    const categories = db.table('categories')
      .where('status', 1)
      .orderBy('order', 'asc')
      .get();

    return sendSuccess(res, {
      categories: categories.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        parent_category: c.parent_category,
        updated_at: c.updated_at
      }))
    });
  } catch (error) {
    console.error('[CategoryController@all] Error:', error);
    return sendError(res, 'Failed to fetch all categories', 500);
  }
}

module.exports = {
  index,
  show,
  related,
  all
};

