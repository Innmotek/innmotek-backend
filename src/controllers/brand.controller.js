/**
 * Innmotek V2 - Brand Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Brand\BrandController
 * 
 * Routes Handled:
 *   - GET /api/brands -> index()
 * 
 * Behavior & Match:
 * - Queries active brands (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md envelope: {"result": "success", "brands": [...]}
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active partner / manufacturer brands.
 * 
 * Route: GET /api/brands
 */
function index(req, res) {
  try {
    const brands = db.table('brands')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      slug: brand.slug,
      title: brand.title,
      image: getImageUrl('brands', brand.image)
    }));

    return sendSuccess(res, 'brands', formattedBrands);
  } catch (error) {
    console.error('[BrandController@index] Error:', error);
    return sendError(res, 'Failed to fetch brands', 500);
  }
}

module.exports = {
  index
};
