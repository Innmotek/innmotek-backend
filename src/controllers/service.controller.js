/**
 * Innmotek V2 - Service Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Service\ServiceController
 * 
 * Routes Handled:
 *   - GET /api/services -> index()
 *   - GET /api/services/:service -> show()
 * 
 * Behavior & Match:
 * - Queries active services (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md response shapes
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active services.
 * 
 * Route: GET /api/services
 */
function index(req, res) {
  try {
    const services = db.table('services')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedServices = services.map(service => ({
      slug: service.slug,
      title: service.title,
      image: getImageUrl('services', service.image)
    }));

    return sendSuccess(res, 'services', formattedServices);
  } catch (error) {
    console.error('[ServiceController@index] Error:', error);
    return sendError(res, 'Failed to fetch services', 500);
  }
}

/**
 * Show detailed service explanation and deliverables.
 * 
 * Route: GET /api/services/:service (service slug or ID)
 */
function show(req, res) {
  try {
    const serviceParam = req.params.service;

    const service = db.table('services')
      .where('slug', serviceParam)
      .first() || db.table('services').find(serviceParam);

    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    const formattedService = {
      slug: service.slug,
      title: service.title,
      description: service.description || null,
      summary: service.summary || null,
      image: getImageUrl('services', service.image),
      seo_title: service.seo_title || null,
      seo_keyword: service.seo_keyword || null,
      seo_description: service.seo_description || null
    };

    return sendSuccess(res, 'service', formattedService);
  } catch (error) {
    console.error('[ServiceController@show] Error:', error);
    return sendError(res, 'Failed to fetch service detail', 500);
  }
}

module.exports = {
  index,
  show
};
