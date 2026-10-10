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
      .get();

    // Sort by order ASC, then id ASC
    banners.sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 0;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 0;
      if (orderA !== orderB) return orderA - orderB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      title: banner.title || '',
      description: banner.description || '',
      url: banner.link_url || banner.url || '',
      image: getImageUrl('banners', banner.image),
      page_placement: banner.page_placement || 'home',
      media_type: banner.media_type || (banner.video_url ? 'video' : 'image'),
      video_url: banner.video_url || null,
      animation_type: banner.animation_type || 'ken_burns',
      order: Number(banner.order) || 0
    }));

    const heroConfig = db.table('hero_settings')?.all()[0] || {
      media_mode: 'image',
      layout_mode: 'carousel',
      transition_engine: 'animation',
      animation_type: 'ken_burns',
      interval_seconds: 6
    };

    return res.json({
      result: 'success',
      banners: formattedBanners,
      config: heroConfig
    });
  } catch (error) {
    console.error('[BannerController@index] Error:', error);
    return sendError(res, 'Failed to fetch banners', 500);
  }
}

module.exports = {
  index
};
