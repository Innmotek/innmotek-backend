/**
 * Innmotek V2 - Project Serialization Helper
 * 
 * Replaces Laravel Helper functions:
 * - get_api_frontend_projects() (app/Helpers/frontendManageApi.php:295)
 * - get_api_frontend_project() (app/Helpers/frontendManageApi.php:314)
 * - get_api_project_images() (app/Helpers/ecommerceManageApi.php:23)
 */

const db = require('../config/database');
const { getImageUrl } = require('../config/storage');
const { formatDate } = require('./date.helper');

/**
 * Format project summaries for gallery/portfolio grids.
 * 
 * @param {Array} projects - Array of project records
 * @returns {Array} List of formatted projects matching API_SPEC.md
 */
function formatProjectList(projects) {
  if (!Array.isArray(projects)) return [];

  return projects.map(proj => ({
    slug: proj.slug,
    title: proj.title,
    image: getImageUrl('projects', proj.image)
  }));
}

/**
 * Format detailed project profile with gallery images.
 * 
 * @param {object} project - Project database record
 * @returns {object|null} Detailed project object
 */
function formatProjectDetail(project) {
  if (!project) return null;

  // Retrieve gallery images from project_images table
  const galleryImages = db.table('project_images')
    .where('project_id', project.id)
    .get();

  const formattedImages = galleryImages.map(img => ({
    id: img.id,
    image: getImageUrl('projects', img.filename),
    slug: img.slug || project.slug
  }));

  return {
    slug: project.slug,
    title: project.title,
    description: project.description || null,
    location: project.location || '',
    website: project.website || null,
    date: formatDate(project.date),
    images: formattedImages,
    image: getImageUrl('projects', project.image),
    seo_title: project.seo_title || null,
    seo_keyword: project.seo_keyword || null,
    seo_description: project.seo_description || null
  };
}

module.exports = {
  formatProjectList,
  formatProjectDetail
};
