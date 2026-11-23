/**
 * Innmotek V2 - Admin Category Controller
 * 
 * Replaces Laravel Backend Admin Controller:
 *   App\Http\Controllers\Backend\Category\CategoryController
 * 
 * Routes Handled:
 *   - GET /api/admin/categories -> index()
 *   - GET /api/admin/categories/:id -> show()
 *   - POST /api/admin/categories -> store()
 *   - PUT /api/admin/categories/:id -> update()
 *   - DELETE /api/admin/categories/:id -> destroy()
 * 
 * Features:
 * - Full parent-child hierarchy support
 * - Image processing to compressed WEBP format
 * - Slug sanitization & uniqueness
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { processBase64Webp, deleteFromStorage } = require('../../helpers/upload.helper');

/**
 * Generate URL-friendly slug from string.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * List all categories with parent titles and product counts.
 * 
 * Route: GET /api/admin/categories
 */
function index(req, res) {
  try {
    const categories = db.table('categories')
      .orderBy('id', 'desc')
      .get();

    const formatted = categories.map(cat => {
      let parentTitle = null;
      let parentSlug = null;
      const effectiveParentId = cat.parent_category !== undefined && cat.parent_category !== null
        ? cat.parent_category
        : cat.parent_id;

      if (effectiveParentId) {
        const parent = db.table('categories').find(effectiveParentId);
        if (parent) {
          parentTitle = parent.title;
          parentSlug = parent.slug;
        }
      }

      // Count direct products in this category
      const productCount = db.table('products')
        .where('category_id', cat.id)
        .count();

      return {
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        parent_id: effectiveParentId ? Number(effectiveParentId) : null,
        parent_category: effectiveParentId ? Number(effectiveParentId) : null,
        parent_title: parentTitle,
        parent_slug: parentSlug,
        status: cat.status !== undefined ? Number(cat.status) : 1,
        featured: cat.featured ? Number(cat.featured) : 0,
        image: getImageUrl('categories', cat.image),
        raw_image: cat.image,
        description: cat.description || null,
        product_count: productCount,
        seo_title: cat.seo_title || null,
        seo_keyword: cat.seo_keyword || null,
        seo_description: cat.seo_description || null,
        created_at: cat.created_at
      };
    });

    return sendSuccess(res, 'categories', formatted);
  } catch (error) {
    console.error('[CategoryAdminController@index] Error:', error);
    return sendError(res, 'Failed to retrieve categories', 500);
  }
}

/**
 * Get category detail by ID.
 * 
 * Route: GET /api/admin/categories/:id
 */
function show(req, res) {
  try {
    const category = db.table('categories').find(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const effectiveParentId = category.parent_category !== undefined && category.parent_category !== null
      ? category.parent_category
      : category.parent_id;

    return sendSuccess(res, 'category', {
      ...category,
      parent_id: effectiveParentId ? Number(effectiveParentId) : null,
      parent_category: effectiveParentId ? Number(effectiveParentId) : null,
      image_url: getImageUrl('categories', category.image)
    });
  } catch (error) {
    console.error('[CategoryAdminController@show] Error:', error);
    return sendError(res, 'Failed to fetch category', 500);
  }
}

/**
 * Create new category with optional image upload.
 * 
 * Route: POST /api/admin/categories
 */
async function store(req, res) {
  try {
    const { title, slug, parent_id, description, status, featured, image_base64, seo_title, seo_keyword, seo_description } = req.body;

    if (!title) {
      return sendError(res, 'Category title is required', 422);
    }

    const cleanSlug = slugify(slug || title);

    // Process image if provided in base64
    let imageName = null;
    if (image_base64) {
      const processed = await processBase64Webp(image_base64, 'categories');
      if (processed) imageName = processed.filename;
    }

    const newCategory = db.table('categories').insert({
      title: title.trim(),
      slug: cleanSlug,
      parent_category: parent_id ? String(parent_id) : null,
      parent_id: parent_id ? Number(parent_id) : null,
      description: description || null,
      image: imageName,
      status: status !== undefined ? Number(status) : 1,
      featured: featured ? Number(featured) : 0,
      seo_title: seo_title || null,
      seo_keyword: seo_keyword || null,
      seo_description: seo_description || null
    });

    return sendSuccess(res, 'category', {
      ...newCategory,
      image_url: getImageUrl('categories', newCategory.image)
    });
  } catch (error) {
    console.error('[CategoryAdminController@store] Error:', error);
    return sendError(res, 'Failed to create category', 500);
  }
}

/**
 * Update existing category.
 * 
 * Route: PUT /api/admin/categories/:id
 */
async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = db.table('categories').find(id);
    if (!existing) {
      return sendError(res, 'Category not found', 404);
    }

    const { title, slug, parent_id, description, status, featured, image_base64, seo_title, seo_keyword, seo_description } = req.body;

    let imageName = existing.image;
    if (image_base64) {
      const processed = await processBase64Webp(image_base64, 'categories');
      if (processed) {
        if (existing.image && existing.image !== processed.filename) {
          deleteFromStorage('categories', existing.image);
        }
        imageName = processed.filename;
      }
    }

    const effectiveExistingParent = existing.parent_category !== undefined && existing.parent_category !== null
      ? existing.parent_category
      : existing.parent_id;

    const resolvedParentId = parent_id !== undefined
      ? (parent_id ? String(parent_id) : null)
      : (effectiveExistingParent ? String(effectiveExistingParent) : null);

    const updated = db.table('categories').update(id, {
      title: title !== undefined ? title.trim() : existing.title,
      slug: slug !== undefined ? slugify(slug) : existing.slug,
      parent_id: resolvedParentId ? Number(resolvedParentId) : null,
      parent_category: resolvedParentId,
      description: description !== undefined ? description : existing.description,
      image: imageName,
      status: status !== undefined ? Number(status) : existing.status,
      featured: featured !== undefined ? Number(featured) : existing.featured,
      seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
      seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
      seo_description: seo_description !== undefined ? seo_description : existing.seo_description
    });

    return sendSuccess(res, 'category', {
      ...updated,
      image_url: getImageUrl('categories', updated.image)
    });
  } catch (error) {
    console.error('[CategoryAdminController@update] Error:', error);
    return sendError(res, 'Failed to update category', 500);
  }
}

/**
 * Delete category.
 * 
 * Route: DELETE /api/admin/categories/:id
 */
function destroy(req, res) {
  try {
    const id = req.params.id;
    const existing = db.table('categories').find(id);
    if (!existing) {
      return sendError(res, 'Category not found', 404);
    }

    if (existing.image) {
      deleteFromStorage('categories', existing.image);
    }

    const deleted = db.table('categories').delete(id);
    if (!deleted) {
      return sendError(res, 'Category not found', 404);
    }

    return sendSuccess(res, { message: 'Category deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('[CategoryAdminController@destroy] Error:', error);
    return sendError(res, 'Failed to delete category', 500);
  }
}

module.exports = {
  index,
  show,
  store,
  update,
  destroy
};
