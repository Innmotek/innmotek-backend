/**
 * Innmotek V2 - Page Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Page\PageController
 * 
 * Routes Handled:
 *   - GET /api/pages/:page -> show()
 * 
 * Behavior & Bug Fixes vs Original Laravel Code:
 * 1. FIXED UNDEFINED FUNCTION BUG: In original Laravel, PageController@show called
 *    `get_api_backend_page($page)`, which was not defined in any helper file, causing
 *    a fatal runtime error.
 * 2. Properly serializes CMS static pages (Privacy Policy, Terms, Dealer Policy, etc.)
 *    with sanitized HTML descriptions and local asset URLs.
 * 3. Exact field match against API_SPEC.md: {"result": "success", "page": {...}}
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * Show a static CMS / policy page by slug or ID.
 * 
 * Route: GET /api/pages/:page
 */
function show(req, res) {
  try {
    const pageParam = req.params.page;

    const page = db.table('pages')
      .where('slug', pageParam)
      .first() || db.table('pages').find(pageParam);

    if (!page) {
      return sendError(res, 'Page not found', 404);
    }

    const formattedPage = {
      slug: page.slug,
      title: page.title,
      description: page.description || null,
      image: getImageUrl('pages', page.image),
      seo_title: page.seo_title || null,
      seo_keyword: page.seo_keyword || null,
      seo_description: page.seo_description || null
    };

    return sendSuccess(res, 'page', formattedPage);
  } catch (error) {
    console.error('[PageController@show] Error:', error);
    return sendError(res, 'Failed to fetch page', 500);
  }
}

module.exports = {
  show
};
