/**
 * Page Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\PageController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-compresses header/banner image to WebP (quality 85)
 *   - Manages HTML page descriptions, slugs, status, and SEO meta tags
 *   - Removed legacy dead fallbacks from old Laravel code
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { slugify } = require('../../helpers/slug.helper');

class PageAdminController {
  index(req, res) {
    try {
      const pages = db.table('pages').all();
      const formatted = pages.map(p => ({
        ...p,
        image_url: getImageUrl('pages', p.image)
      }));
      return sendSuccess(res, 'pages', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const page = db.table('pages').find(req.params.id);
      if (!page) return sendError(res, 'Page not found', 404);

      return sendSuccess(res, 'page', {
        ...page,
        image_url: getImageUrl('pages', page.image)
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
        description,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      if (!title) return sendError(res, 'Page title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'pages');
      }

      const generatedSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      const newPage = db.table('pages').insert({
        title,
        slug: generatedSlug,
        description: description || '',
        status: status !== undefined ? Number(status) : 1,
        seo_title: seo_title || '',
        seo_keyword: seo_keyword || '',
        seo_description: seo_description || '',
        image: filename || ''
      });

      return sendSuccess(res, 'page', {
        ...newPage,
        image_url: getImageUrl('pages', newPage.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('pages').find(id);
      if (!existing) return sendError(res, 'Page not found', 404);

      const {
        title,
        slug,
        description,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'pages');
      }

      const updatedSlug = slug !== undefined
        ? slugify(slug, { lower: true, strict: true })
        : existing.slug;

      const updated = db.table('pages').update(id, {
        title: title !== undefined ? title : existing.title,
        slug: updatedSlug,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? Number(status) : existing.status,
        seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
        seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
        seo_description: seo_description !== undefined ? seo_description : existing.seo_description,
        image: filename
      });

      return sendSuccess(res, 'page', {
        ...updated,
        image_url: getImageUrl('pages', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('pages').find(id);
      if (!existing) return sendError(res, 'Page not found', 404);

      db.table('pages').delete(id);
      return sendSuccess(res, 'message', 'Page deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new PageAdminController();
