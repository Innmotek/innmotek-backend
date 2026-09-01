/**
 * Testimonial Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\TestimonialController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Compresses client avatar/photo to WebP (quality 85)
 *   - Supports full_name, position, company, rating (1-5), and quote message
 *   - Standard JSON envelope
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const crypto = require('crypto');

class TestimonialAdminController {
  index(req, res) {
    try {
      const testimonials = db.table('testimonials').all();
      const formatted = testimonials.map(t => ({
        ...t,
        image_url: getImageUrl('testimonials', t.image)
      }));
      return sendSuccess(res, 'testimonials', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const testimonial = db.table('testimonials').find(req.params.id);
      if (!testimonial) return sendError(res, 'Testimonial not found', 404);

      return sendSuccess(res, 'testimonial', {
        ...testimonial,
        image_url: getImageUrl('testimonials', testimonial.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async store(req, res) {
    try {
      const {
        full_name,
        position,
        company,
        message,
        rating,
        status,
        image_base64
      } = req.body;

      if (!full_name) return sendError(res, 'Client name is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'testimonials');
      }

      const newTestimonial = db.table('testimonials').insert({
        slug: crypto.randomUUID(),
        full_name,
        position: position || '',
        company: company || '',
        message: message || '',
        rating: Number(rating) || 5,
        status: status !== undefined ? Number(status) : 1,
        image: filename || ''
      });

      return sendSuccess(res, 'testimonial', {
        ...newTestimonial,
        image_url: getImageUrl('testimonials', newTestimonial.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('testimonials').find(id);
      if (!existing) return sendError(res, 'Testimonial not found', 404);

      const {
        full_name,
        position,
        company,
        message,
        rating,
        status,
        image_base64
      } = req.body;

      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'testimonials');
      }

      const updated = db.table('testimonials').update(id, {
        full_name: full_name !== undefined ? full_name : existing.full_name,
        position: position !== undefined ? position : existing.position,
        company: company !== undefined ? company : existing.company,
        message: message !== undefined ? message : existing.message,
        rating: rating !== undefined ? Number(rating) : existing.rating,
        status: status !== undefined ? Number(status) : existing.status,
        image: filename
      });

      return sendSuccess(res, 'testimonial', {
        ...updated,
        image_url: getImageUrl('testimonials', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('testimonials').find(id);
      if (!existing) return sendError(res, 'Testimonial not found', 404);

      db.table('testimonials').delete(id);
      return sendSuccess(res, 'message', 'Testimonial deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new TestimonialAdminController();
