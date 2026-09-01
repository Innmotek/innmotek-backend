/**
 * Service Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\ServiceController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-compresses service hero image to WebP (quality 85)
 *   - Manages service descriptions, summary, and SEO meta tags
 *   - RESTful JSON API structure
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { slugify } = require('../../helpers/slug.helper');

class ServiceAdminController {
  index(req, res) {
    try {
      const services = db.table('services').all();
      const formatted = services.map(s => ({
        ...s,
        image_url: getImageUrl('services', s.image)
      }));
      return sendSuccess(res, 'services', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const service = db.table('services').find(req.params.id);
      if (!service) return sendError(res, 'Service not found', 404);

      return sendSuccess(res, 'service', {
        ...service,
        image_url: getImageUrl('services', service.image)
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
        summary,
        description,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      if (!title) return sendError(res, 'Service title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'services');
      }

      const generatedSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      const newService = db.table('services').insert({
        title,
        slug: generatedSlug,
        summary: summary || '',
        description: description || '',
        status: status !== undefined ? Number(status) : 1,
        seo_title: seo_title || '',
        seo_keyword: seo_keyword || '',
        seo_description: seo_description || '',
        image: filename || ''
      });

      return sendSuccess(res, 'service', {
        ...newService,
        image_url: getImageUrl('services', newService.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('services').find(id);
      if (!existing) return sendError(res, 'Service not found', 404);

      const {
        title,
        slug,
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
        filename = await processBase64Webp(image_base64, 'services');
      }

      const updatedSlug = slug !== undefined
        ? slugify(slug, { lower: true, strict: true })
        : existing.slug;

      const updated = db.table('services').update(id, {
        title: title !== undefined ? title : existing.title,
        slug: updatedSlug,
        summary: summary !== undefined ? summary : existing.summary,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? Number(status) : existing.status,
        seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
        seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
        seo_description: seo_description !== undefined ? seo_description : existing.seo_description,
        image: filename
      });

      return sendSuccess(res, 'service', {
        ...updated,
        image_url: getImageUrl('services', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('services').find(id);
      if (!existing) return sendError(res, 'Service not found', 404);

      db.table('services').delete(id);
      return sendSuccess(res, 'message', 'Service deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new ServiceAdminController();
