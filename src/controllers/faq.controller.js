/**
 * Innmotek V2 - FAQ Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Faq\FaqController
 * 
 * Routes Handled:
 *   - GET /api/faqs -> index()
 * 
 * Behavior & Match:
 * - Queries active FAQ categories (faq_types where status = 1)
 * - Embeds active questions and answers for each category
 * - Returns exact API_SPEC.md envelope: {"result": "success", "types": [...]}
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active FAQs grouped by category type.
 * 
 * Route: GET /api/faqs
 */
function index(req, res) {
  try {
    const faqTypes = db.table('faq_types')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedTypes = faqTypes.map(type => {
      const faqs = db.table('faqs')
        .where('type_id', type.id)
        .where('status', 1)
        .orderBy('id', 'asc')
        .get();

      return {
        title: type.title,
        faqs: faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }))
      };
    });

    return sendSuccess(res, 'types', formattedTypes);
  } catch (error) {
    console.error('[FaqController@index] Error:', error);
    return sendError(res, 'Failed to fetch FAQs', 500);
  }
}

module.exports = {
  index
};
