/**
 * Brand Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\BrandController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-compresses brand partner logo to WebP format (quality 85)
 *   - Handles title, website URL, slug, status
 *   - RESTful JSON API structure
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { slugify } = require('../../helpers/slug.helper');

class BrandAdminController {
  index(req, res) {
    try {
      const brands = db.table('brands').all();
      const formatted = brands.map(b => ({
        ...b,
        image_url: getImageUrl('brands', b.image)
      }));
      return sendSuccess(res, 'brands', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const brand = db.table('brands').find(req.params.id);
      if (!brand) return sendError(res, 'Brand not found', 404);

      return sendSuccess(res, 'brand', {
        ...brand,
        image_url: getImageUrl('brands', brand.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async store(req, res) {
    try {
      const { title, slug, url, status, image_base64 } = req.body;
      if (!title) return sendError(res, 'Brand name is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'brands');
      }

      const generatedSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      const newBrand = db.table('brands').insert({
        title,
        slug: generatedSlug,
        url: url || '',
        status: status !== undefined ? Number(status) : 1,
        image: filename || ''
      });

      return sendSuccess(res, 'brand', {
        ...newBrand,
        image_url: getImageUrl('brands', newBrand.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('brands').find(id);
      if (!existing) return sendError(res, 'Brand not found', 404);

      const { title, slug, url, status, image_base64 } = req.body;

      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'brands');
      }

      const updatedSlug = slug !== undefined
        ? slugify(slug, { lower: true, strict: true })
        : existing.slug;

      const updated = db.table('brands').update(id, {
        title: title !== undefined ? title : existing.title,
        slug: updatedSlug,
        url: url !== undefined ? url : existing.url,
        status: status !== undefined ? Number(status) : existing.status,
        image: filename
      });

      return sendSuccess(res, 'brand', {
        ...updated,
        image_url: getImageUrl('brands', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('brands').find(id);
      if (!existing) return sendError(res, 'Brand not found', 404);

      db.table('brands').delete(id);
      return sendSuccess(res, 'message', 'Brand deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new BrandAdminController();
