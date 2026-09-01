/**
 * Banner Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\BannerController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-compresses uploaded hero banner images to WebP format (quality 85)
 *   - Uses RESTful JSON response format { result: 'success', banner: {...} }
 *   - Slugs auto-generated if omitted
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const crypto = require('crypto');

class BannerAdminController {
  index(req, res) {
    try {
      const banners = db.table('banners').all();
      const formatted = banners.map(b => ({
        ...b,
        image_url: getImageUrl('banners', b.image)
      }));
      return sendSuccess(res, 'banners', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const banner = db.table('banners').find(req.params.id);
      if (!banner) return sendError(res, 'Banner not found', 404);

      return sendSuccess(res, 'banner', {
        ...banner,
        image_url: getImageUrl('banners', banner.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async store(req, res) {
    try {
      const { title, url, description, type, order, status, image_base64 } = req.body;
      if (!title) return sendError(res, 'Banner title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'banners');
      }

      const newBanner = db.table('banners').insert({
        slug: crypto.randomUUID(),
        title,
        url: url || '',
        description: description || '',
        type: type || 'main',
        order: Number(order) || 0,
        status: status !== undefined ? Number(status) : 1,
        image: filename || ''
      });

      return sendSuccess(res, 'banner', {
        ...newBanner,
        image_url: getImageUrl('banners', newBanner.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('banners').find(id);
      if (!existing) return sendError(res, 'Banner not found', 404);

      const { title, url, description, type, order, status, image_base64 } = req.body;
      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'banners');
      }

      const updated = db.table('banners').update(id, {
        title: title !== undefined ? title : existing.title,
        url: url !== undefined ? url : existing.url,
        description: description !== undefined ? description : existing.description,
        type: type !== undefined ? type : existing.type,
        order: order !== undefined ? Number(order) : existing.order,
        status: status !== undefined ? Number(status) : existing.status,
        image: filename
      });

      return sendSuccess(res, 'banner', {
        ...updated,
        image_url: getImageUrl('banners', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('banners').find(id);
      if (!existing) return sendError(res, 'Banner not found', 404);

      db.table('banners').delete(id);
      return sendSuccess(res, 'message', 'Banner deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new BannerAdminController();
