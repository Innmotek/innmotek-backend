/**
 * Innmotek V2 - Project Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Project\ProjectController
 * 
 * Routes Handled:
 *   - GET /api/projects -> index()
 *   - GET /api/projects/:project -> show()
 * 
 * Behavior & Match:
 * - Queries active projects (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md response shapes including gallery images and location metadata
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');
const { formatProjectList, formatProjectDetail } = require('../helpers/project.helper');

/**
 * List all active projects/case studies.
 * 
 * Route: GET /api/projects
 */
function index(req, res) {
  try {
    const projects = db.table('projects')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedProjects = formatProjectList(projects);

    return sendSuccess(res, 'projects', formattedProjects);
  } catch (error) {
    console.error('[ProjectController@index] Error:', error);
    return sendError(res, 'Failed to fetch projects', 500);
  }
}

/**
 * Show detailed project case study with gallery images.
 * 
 * Route: GET /api/projects/:project (project slug or ID)
 */
function show(req, res) {
  try {
    const projectParam = req.params.project;

    const project = db.table('projects')
      .where('slug', projectParam)
      .first() || db.table('projects').find(projectParam);

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const formattedProject = formatProjectDetail(project);

    return sendSuccess(res, 'project', formattedProject);
  } catch (error) {
    console.error('[ProjectController@show] Error:', error);
    return sendError(res, 'Failed to fetch project detail', 500);
  }
}

module.exports = {
  index,
  show
};
