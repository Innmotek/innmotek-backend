/**
 * Innmotek V2 - Featured Products Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Product\FeaturedController
 * 
 * Routes Handled:
 *   - GET /api/featured/products -> index()
 * 
 * Behavior & Bug Fixes vs Original Laravel Code:
 * 1. FIXED HARDCODED STRINGS: The old Laravel code did fragile string comparisons on
 *    specific product title literals ($item->title == 'Full Inverter Dehumidify360').
 * 2. In this implementation, we query products dynamically using the `featured_product = 1`
 *    column from the database schema (with intelligent fallback to flagship product models).
 * 3. Exact field and wrapper match against API_SPEC.md.
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');
const { formatFeaturedProducts } = require('../helpers/product.helper');

/**
 * List featured products for homepage and showcase sections.
 * 
 * Route: GET /api/featured/products
 */
function index(req, res) {
  try {
    // 1. Check for explicitly flagged featured products (featured_product = 1)
    let featuredList = db.table('products')
      .where('featured_product', 1)
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    // 2. Fallback if no products are explicitly marked in seed data: fetch top active products
    if (featuredList.length === 0) {
      featuredList = db.table('products')
        .where('status', 1)
        .orderBy('id', 'desc')
        .take(6)
        .get();
    }

    const formattedFeatured = formatFeaturedProducts(featuredList);

    return sendSuccess(res, 'products', formattedFeatured);
  } catch (error) {
    console.error('[FeaturedController@index] Error:', error);
    return sendError(res, 'Failed to fetch featured products', 500);
  }
}

module.exports = {
  index
};
