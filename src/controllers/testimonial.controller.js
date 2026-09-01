/**
 * Innmotek V2 - Testimonial Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Testimonial\TestimonialController
 * 
 * Routes Handled:
 *   - GET /api/testimonials -> index()
 * 
 * Behavior & Match:
 * - Queries active testimonials (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md envelope: {"result": "success", "testimonials": [...]}
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active client testimonials.
 * 
 * Route: GET /api/testimonials
 */
function index(req, res) {
  try {
    const testimonials = db.table('testimonials')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedTestimonials = testimonials.map(item => ({
      name: item.full_name,
      company: item.company_name || null,
      position: item.position || null,
      message: item.message,
      image: getImageUrl('testimonials', item.image)
    }));

    return sendSuccess(res, 'testimonials', formattedTestimonials);
  } catch (error) {
    console.error('[TestimonialController@index] Error:', error);
    return sendError(res, 'Failed to fetch testimonials', 500);
  }
}

module.exports = {
  index
};
