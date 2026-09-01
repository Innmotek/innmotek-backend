/**
 * Blog Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\BlogController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Auto-generates WebP compressed featured image
 *   - Supports SEO fields (seo_title, seo_keyword, seo_description), quote, and summary
 *   - Full JSON REST response format
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { processBase64Webp } = require('../../helpers/upload.helper');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { slugify } = require('../../helpers/slug.helper');

class BlogAdminController {
  index(req, res) {
    try {
      const blogs = db.table('blogs').all();
      const categories = db.table('categories').all();
      const catMap = new Map(categories.map(c => [c.id, c.title]));

      const formatted = blogs.map(b => ({
        ...b,
        category_title: catMap.get(b.category_id) || 'General',
        image_url: getImageUrl('blogs', b.image)
      }));
      return sendSuccess(res, 'blogs', formatted);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const blog = db.table('blogs').find(req.params.id);
      if (!blog) return sendError(res, 'Blog post not found', 404);

      return sendSuccess(res, 'blog', {
        ...blog,
        image_url: getImageUrl('blogs', blog.image)
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
        category_id,
        summary,
        description,
        quote,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      if (!title) return sendError(res, 'Article title is required', 422);

      let filename = null;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'blogs');
      }

      const generatedSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      const newBlog = db.table('blogs').insert({
        title,
        slug: generatedSlug,
        user_id: 2,
        category_id: Number(category_id) || 1,
        summary: summary || '',
        description: description || '',
        quote: quote || '',
        status: status !== undefined ? Number(status) : 1,
        view: 0,
        seo_title: seo_title || '',
        seo_keyword: seo_keyword || '',
        seo_description: seo_description || '',
        image: filename || ''
      });

      return sendSuccess(res, 'blog', {
        ...newBlog,
        image_url: getImageUrl('blogs', newBlog.image)
      }, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('blogs').find(id);
      if (!existing) return sendError(res, 'Blog post not found', 404);

      const {
        title,
        slug,
        category_id,
        summary,
        description,
        quote,
        status,
        seo_title,
        seo_keyword,
        seo_description,
        image_base64
      } = req.body;

      let filename = existing.image;
      if (image_base64) {
        filename = await processBase64Webp(image_base64, 'blogs');
      }

      const updatedSlug = slug !== undefined
        ? slugify(slug, { lower: true, strict: true })
        : existing.slug;

      const updated = db.table('blogs').update(id, {
        title: title !== undefined ? title : existing.title,
        slug: updatedSlug,
        category_id: category_id !== undefined ? Number(category_id) : existing.category_id,
        summary: summary !== undefined ? summary : existing.summary,
        description: description !== undefined ? description : existing.description,
        quote: quote !== undefined ? quote : existing.quote,
        status: status !== undefined ? Number(status) : existing.status,
        seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
        seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
        seo_description: seo_description !== undefined ? seo_description : existing.seo_description,
        image: filename
      });

      return sendSuccess(res, 'blog', {
        ...updated,
        image_url: getImageUrl('blogs', updated.image)
      });
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('blogs').find(id);
      if (!existing) return sendError(res, 'Blog post not found', 404);

      db.table('blogs').delete(id);
      return sendSuccess(res, 'message', 'Blog post deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new BlogAdminController();
