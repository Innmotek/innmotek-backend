/**
 * Project Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\ProjectController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-compresses project showcase cover images to WebP format (quality 85)
 *   - Manages client, location, completed_date metadata along with SEO fields
 *   - Clean empty array handling when 0 projects exist in database
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { slugify } = require('../../helpers/slug.helper');

class ProjectAdminController {
  index(req, res) {
    try {
      const projects = db.table('projects').all();
      const formatted = projects.map(p => ({
        ...p,
        image_url: getImageUrl('projects', p.image)
      }));
      return sendSuccess(res, 'projects', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const project = db.table('projects').find(req.params.id);
      if (!project) return sendError(res, 'Project not found', 404);

      return sendSuccess(res, 'project', {
        ...project,
        image_url: getImageUrl('projects', project.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async store(req, res) {
    try {
      const {
        title,
        slug,
        client,
        location,
        completed_date,
        summary,
        description,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      if (!title) return sendError(res, 'Project title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'projects');
      }

      const generatedSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      const newProject = db.table('projects').insert({
        title,
        slug: generatedSlug,
        client: client || '',
        location: location || '',
        completed_date: completed_date || '',
        summary: summary || '',
        description: description || '',
        status: status !== undefined ? Number(status) : 1,
        seo_title: seo_title || '',
        seo_keyword: seo_keyword || '',
        seo_description: seo_description || '',
        image: filename || ''
      });

      return sendSuccess(res, 'project', {
        ...newProject,
        image_url: getImageUrl('projects', newProject.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('projects').find(id);
      if (!existing) return sendError(res, 'Project not found', 404);

      const {
        title,
        slug,
        client,
        location,
        completed_date,
        summary,
        description,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'projects');
      }

      const updatedSlug = slug !== undefined
        ? slugify(slug, { lower: true, strict: true })
        : existing.slug;

      const updated = db.table('projects').update(id, {
        title: title !== undefined ? title : existing.title,
        slug: updatedSlug,
        client: client !== undefined ? client : existing.client,
        location: location !== undefined ? location : existing.location,
        completed_date: completed_date !== undefined ? completed_date : existing.completed_date,
        summary: summary !== undefined ? summary : existing.summary,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? Number(status) : existing.status,
        seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
        seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
        seo_description: seo_description !== undefined ? seo_description : existing.seo_description,
        image: filename
      });

      return sendSuccess(res, 'project', {
        ...updated,
        image_url: getImageUrl('projects', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('projects').find(id);
      if (!existing) return sendError(res, 'Project not found', 404);

      db.table('projects').delete(id);
      return sendSuccess(res, 'message', 'Project deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new ProjectAdminController();
