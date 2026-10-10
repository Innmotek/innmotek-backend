/**
 * Banner Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\BannerController (index, create, store, edit, update, destroy)
 * 
 * Features:
 *   - Auto-compresses uploaded hero banner images to WebP format (quality 85)
 *   - Supports media_type ('image' | 'video'), video_url, animation_type, page_placement, order
 *   - Manages global Hero Engine Configuration (media_mode, layout_mode, transition_engine, animation_type)
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
        status: Number(b.status) !== undefined ? Number(b.status) : 1,
        order: Number(b.order) || 0,
        page_placement: b.page_placement || 'home',
        media_type: b.media_type || (b.video_url ? 'video' : 'image'),
        animation_type: b.animation_type || 'ken_burns',
        image_url: getImageUrl('banners', b.image)
      }));

      // Sort: Active first (status = 1), then order ASC (1, 2, 3...), then id DESC
      formatted.sort((a, b) => {
        if (b.status !== a.status) return b.status - a.status; // Active first
        if (a.order !== b.order) return a.order - b.order;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      const configRow = db.table('hero_settings')?.all()[0] || {
        media_mode: 'image',
        layout_mode: 'carousel',
        transition_engine: 'animation',
        animation_type: 'ken_burns',
        interval_seconds: 6
      };

      return res.json({
        result: 'success',
        banners: formatted,
        config: configRow
      });
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
        status: Number(banner.status),
        order: Number(banner.order) || 0,
        page_placement: banner.page_placement || 'home',
        image_url: getImageUrl('banners', banner.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async getConfig(req, res) {
    try {
      const configRow = db.table('hero_settings')?.all()[0] || {
        media_mode: 'image',
        layout_mode: 'carousel',
        transition_engine: 'animation',
        animation_type: 'ken_burns',
        interval_seconds: 6
      };
      return res.json({ result: 'success', config: configRow });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async updateConfig(req, res) {
    try {
      const { media_mode, layout_mode, transition_engine, animation_type, interval_seconds } = req.body;
      let existing = db.table('hero_settings')?.all()[0];

      if (existing) {
        db.table('hero_settings').update(existing.id, {
          media_mode: media_mode || existing.media_mode,
          layout_mode: layout_mode || existing.layout_mode,
          transition_engine: transition_engine || existing.transition_engine,
          animation_type: animation_type || existing.animation_type,
          interval_seconds: Number(interval_seconds) || existing.interval_seconds || 6
        });
        existing = db.table('hero_settings').find(existing.id);
      } else {
        existing = db.table('hero_settings').insert({
          media_mode: media_mode || 'image',
          layout_mode: layout_mode || 'carousel',
          transition_engine: transition_engine || 'animation',
          animation_type: animation_type || 'ken_burns',
          interval_seconds: Number(interval_seconds) || 6
        });
      }

      return res.json({ result: 'success', config: existing });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async store(req, res) {
    try {
      const { title, url, description, type, order, status, image_base64, media_type, video_url, animation_type, page_placement } = req.body;
      if (!title) return sendError(res, 'Banner title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'banners');
      }

      const newBanner = db.table('banners').insert({
        slug: crypto.randomUUID(),
        title,
        url: url || '',
        link_url: url || '',
        description: description || '',
        type: type || 'main',
        page_placement: page_placement || 'home',
        media_type: media_type || 'image',
        video_url: video_url || null,
        animation_type: animation_type || 'ken_burns',
        order: Number(order) || 0,
        status: status !== undefined ? Number(status) : 1,
        image: filename || ''
      });

      return sendSuccess(res, 'banner', {
        ...newBanner,
        status: Number(newBanner.status),
        order: Number(newBanner.order) || 0,
        page_placement: newBanner.page_placement || 'home',
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

      const { title, url, description, type, order, status, image_base64, media_type, video_url, animation_type, page_placement } = req.body;
      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'banners');
      }

      const updated = db.table('banners').update(id, {
        title: title !== undefined ? title : existing.title,
        url: url !== undefined ? url : existing.url,
        link_url: url !== undefined ? url : existing.link_url,
        description: description !== undefined ? description : existing.description,
        type: type !== undefined ? type : existing.type,
        page_placement: page_placement !== undefined ? page_placement : existing.page_placement,
        media_type: media_type !== undefined ? media_type : existing.media_type,
        video_url: video_url !== undefined ? video_url : existing.video_url,
        animation_type: animation_type !== undefined ? animation_type : existing.animation_type,
        order: order !== undefined ? Number(order) : existing.order,
        status: status !== undefined ? Number(status) : existing.status,
        image: filename
      });

      return sendSuccess(res, 'banner', {
        ...updated,
        status: Number(updated.status),
        order: Number(updated.order) || 0,
        page_placement: updated.page_placement || 'home',
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
