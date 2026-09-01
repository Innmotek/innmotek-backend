/**
 * Innmotek V2 - Plugin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Plugin\PluginController
 * 
 * Routes Handled:
 *   - GET /api/plugins -> index()
 * 
 * Behavior & Match:
 * - Queries active script injections and tracking plugins (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md envelope: {"result": "success", "plugins": [...]}
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * List all active tracking and analytics plugins.
 * 
 * Route: GET /api/plugins
 */
function index(req, res) {
  try {
    const plugins = db.table('plugins')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedPlugins = plugins.map(item => ({
      tag_type: item.tag_type,
      code: item.code,
      type: item.type
    }));

    return sendSuccess(res, 'plugins', formattedPlugins);
  } catch (error) {
    console.error('[PluginController@index] Error:', error);
    return sendError(res, 'Failed to fetch plugins', 500);
  }
}

module.exports = {
  index
};
