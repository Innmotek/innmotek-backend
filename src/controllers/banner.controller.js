/**
 * Innmotek V2 - Banner Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Banner\BannerController
 * 
 * Routes Handled:
 *   - GET /api/banners -> index()
 * 
 * Behavior & Match:
 * - Queries active banners (status = 1, ordered by id desc)
 * - Builds image URL using getImageUrl('banners', banner.image)
 * - Returns exact API_SPEC.md envelope: {"result": "success", "banners": [...]}
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active banners for homepage sliders.
 * 
 * Route: GET /api/banners
 */
function index(req, res) {
  try {
    const banners = db.table('banners')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedBanners = banners.map(banner => ({
      title: banner.title,
      image: getImageUrl('banners', banner.image)
    }));

    return sendSuccess(res, 'banners', formattedBanners);
  } catch (error) {
    console.error('[BannerController@index] Error:', error);
    return sendError(res, 'Failed to fetch banners', 500);
  }
}

module.exports = {
  index
};
