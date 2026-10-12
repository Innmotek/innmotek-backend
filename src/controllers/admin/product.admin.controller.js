/**
 * Innmotek V2 - Admin Product Controller
 * 
 * Replaces Laravel Backend Admin Controller:
 *   App\Http\Controllers\Backend\Product\ProductController
 * 
 * Routes Handled:
 *   - GET /api/admin/products -> index()
 *   - GET /api/admin/products/:id -> show()
 *   - POST /api/admin/products -> store()
 *   - PUT /api/admin/products/:id -> update()
 *   - DELETE /api/admin/products/:id -> destroy()
 * 
 * Features:
 * - Category and Brand associations
 * - Main image and multiple gallery images (images table relationship)
 * - Sharp WEBP compression pipeline
 * - Full technical specs: summary, description, warranty, specification, installation, SEO
 */

const db = require('../../config/database');
const { getImageUrl } = require('../../config/storage');
const { sendSuccess, sendError } = require('../../helpers/response.helper');
const { processBase64Webp, processBase64Document } = require('../../helpers/upload.helper');

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
 * Process downloadable brochures/spec sheets into clean JSON array string.
 */
async function parseAndProcessDownloads(rawDownload, rawDownloads) {
  const payload = rawDownloads !== undefined ? rawDownloads : rawDownload;
  if (!payload) return null;

  let items = [];
  if (Array.isArray(payload)) {
    items = payload;
  } else if (typeof payload === 'string' && payload.trim()) {
    try {
      const parsed = JSON.parse(payload);
      items = Array.isArray(parsed) ? parsed : [{ title: 'Technical Brochure', file: payload.trim() }];
    } catch {
      return payload.trim();
    }
  }

  const processed = [];
  for (const item of items) {
    if (!item) continue;
    let fileUrl = item.file || item.url || '';
    if (item.file_base64) {
      const docRes = await processBase64Document(item.file_base64, item.filename || `${item.title || 'document'}.pdf`);
      if (docRes) fileUrl = docRes.url;
    }
    if (fileUrl) {
      processed.push({
        title: item.title || 'Technical Brochure',
        file: fileUrl
      });
    }
  }

  return processed.length > 0 ? JSON.stringify(processed) : null;
}


/**
 * List all products for Admin table.
 * 
 * Route: GET /api/admin/products
 */
function index(req, res) {
  try {
    const products = db.table('products')
      .orderBy('id', 'desc')
      .get();

    const formatted = products.map(prod => {
      let categoryTitle = null;
      if (prod.category_id) {
        const cat = db.table('categories').find(prod.category_id);
        if (cat) categoryTitle = cat.title;
      }

      let brandTitle = null;
      if (prod.brand_id) {
        const brand = db.table('brands').find(prod.brand_id);
        if (brand) brandTitle = brand.title;
      }

      // Count gallery images
      const galleryCount = db.table('images')
        .where('product_id', prod.id)
        .count();

      return {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        category_id: prod.category_id || null,
        category_title: categoryTitle,
        brand_id: prod.brand_id || null,
        brand_title: brandTitle,
        featured_product: Number(prod.featured_product) === 1 ? 1 : 0,
        status: prod.status !== undefined ? Number(prod.status) : 1,
        image: getImageUrl('products', prod.image),
        raw_image: prod.image,
        summary: prod.summary || null,
        gallery_count: galleryCount,
        created_at: prod.created_at
      };
    });

    return sendSuccess(res, 'products', formatted);
  } catch (error) {
    console.error('[ProductAdminController@index] Error:', error);
    return sendError(res, 'Failed to fetch products', 500);
  }
}

/**
 * Get product detail by ID with gallery images.
 * 
 * Route: GET /api/admin/products/:id
 */
function show(req, res) {
  try {
    const id = req.params.id;
    const product = db.table('products').find(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const galleryRecords = db.table('images')
      .where('product_id', product.id)
      .get();

    const formattedGallery = galleryRecords.map(img => ({
      id: img.id,
      filename: img.filename,
      url: getImageUrl('products', img.filename)
    }));

    return sendSuccess(res, 'product', {
      ...product,
      image_url: getImageUrl('products', product.image),
      gallery: formattedGallery
    });
  } catch (error) {
    console.error('[ProductAdminController@show] Error:', error);
    return sendError(res, 'Failed to fetch product detail', 500);
  }
}

/**
 * Create new product with main image and gallery images.
 * 
 * Route: POST /api/admin/products
 */
async function store(req, res) {
  try {
    const {
      title,
      slug,
      category_id,
      brand_id,
      description,
      summary,
      warrenty,
      specification,
      installation,
      download,
      downloads,
      featured_product,
      status,
      image_base64,
      gallery_base64,
      seo_title,
      seo_keyword,
      seo_description
    } = req.body;

    if (!title) {
      return sendError(res, 'Product title is required', 422);
    }

    const cleanSlug = slugify(slug || title);

    // 1. Process main image with Sharp WEBP
    let mainImageName = null;
    if (image_base64) {
      const processed = await processBase64Webp(image_base64, 'products');
      if (processed) mainImageName = processed.filename;
    }

    // 2. Process downloadable brochures/specifications
    const finalDownload = await parseAndProcessDownloads(download, downloads);

    // 3. Insert master product record
    const newProduct = db.table('products').insert({
      title: title.trim(),
      slug: cleanSlug,
      category_id: category_id ? Number(category_id) : null,
      brand_id: brand_id ? Number(brand_id) : null,
      description: description || null,
      summary: summary || null,
      warrenty: warrenty || null,
      specification: specification || null,
      installation: installation || null,
      download: finalDownload,
      featured_product: featured_product ? 1 : 0,
      status: status !== undefined ? Number(status) : 1,
      image: mainImageName,
      seo_title: seo_title || null,
      seo_keyword: seo_keyword || null,
      seo_description: seo_description || null
    });

    // 3. Process and insert gallery images if provided
    const galleryItems = [];
    if (Array.isArray(gallery_base64) && gallery_base64.length > 0) {
      for (const gBase64 of gallery_base64) {
        const processedG = await processBase64Webp(gBase64, 'products');
        if (processedG) {
          const gRecord = db.table('images').insert({
            product_id: newProduct.id,
            filename: processedG.filename
          });
          galleryItems.push({
            id: gRecord.id,
            filename: processedG.filename,
            url: processedG.url
          });
        }
      }
    }

    return sendSuccess(res, 'product', {
      ...newProduct,
      image_url: getImageUrl('products', newProduct.image),
      gallery: galleryItems
    });
  } catch (error) {
    console.error('[ProductAdminController@store] Error:', error);
    return sendError(res, 'Failed to create product', 500);
  }
}

/**
 * Update existing product.
 * 
 * Route: PUT /api/admin/products/:id
 */
async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = db.table('products').find(id);
    if (!existing) {
      return sendError(res, 'Product not found', 404);
    }

    const {
      title,
      slug,
      category_id,
      brand_id,
      description,
      summary,
      warrenty,
      specification,
      installation,
      download,
      downloads,
      featured_product,
      status,
      image_base64,
      gallery_base64,
      deleted_gallery_ids,
      seo_title,
      seo_keyword,
      seo_description
    } = req.body;

    // 1. Process main image replacement if new base64 provided
    let mainImageName = existing.image;
    if (image_base64) {
      const processed = await processBase64Webp(image_base64, 'products');
      if (processed) mainImageName = processed.filename;
    }

    // 2. Process downloadable brochures/specifications if supplied
    let finalDownload = undefined;
    if (download !== undefined || downloads !== undefined) {
      finalDownload = await parseAndProcessDownloads(download, downloads);
    }

    // 3. Update product master
    const updated = db.table('products').update(id, {
      title: title !== undefined ? title.trim() : existing.title,
      slug: slug !== undefined ? slugify(slug) : existing.slug,
      category_id: category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id,
      brand_id: brand_id !== undefined ? (brand_id ? Number(brand_id) : null) : existing.brand_id,
      description: description !== undefined ? description : existing.description,
      summary: summary !== undefined ? summary : existing.summary,
      warrenty: warrenty !== undefined ? warrenty : existing.warrenty,
      specification: specification !== undefined ? specification : existing.specification,
      installation: installation !== undefined ? installation : existing.installation,
      download: finalDownload !== undefined ? finalDownload : existing.download,
      featured_product: featured_product !== undefined ? (featured_product ? 1 : 0) : existing.featured_product,
      status: status !== undefined ? Number(status) : existing.status,
      image: mainImageName,
      seo_title: seo_title !== undefined ? seo_title : existing.seo_title,
      seo_keyword: seo_keyword !== undefined ? seo_keyword : existing.seo_keyword,
      seo_description: seo_description !== undefined ? seo_description : existing.seo_description
    });

    // 3. Handle gallery deletions
    if (Array.isArray(deleted_gallery_ids) && deleted_gallery_ids.length > 0) {
      deleted_gallery_ids.forEach(gId => {
        db.table('images').delete(gId);
      });
    }

    // 4. Add new gallery items if provided
    if (Array.isArray(gallery_base64) && gallery_base64.length > 0) {
      for (const gBase64 of gallery_base64) {
        const processedG = await processBase64Webp(gBase64, 'products');
        if (processedG) {
          db.table('images').insert({
            product_id: updated.id,
            filename: processedG.filename
          });
        }
      }
    }

    const currentGallery = db.table('images')
      .where('product_id', updated.id)
      .get()
      .map(img => ({
        id: img.id,
        filename: img.filename,
        url: getImageUrl('products', img.filename)
      }));

    return sendSuccess(res, 'product', {
      ...updated,
      image_url: getImageUrl('products', updated.image),
      gallery: currentGallery
    });
  } catch (error) {
    console.error('[ProductAdminController@update] Error:', error);
    return sendError(res, 'Failed to update product', 500);
  }
}

/**
 * Delete product and gallery images.
 * 
 * Route: DELETE /api/admin/products/:id
 */
function destroy(req, res) {
  try {
    const id = req.params.id;
    const deleted = db.table('products').delete(id);
    if (!deleted) {
      return sendError(res, 'Product not found', 404);
    }

    // Also remove associated gallery images
    const gallery = db.table('images').where('product_id', id).get();
    gallery.forEach(img => {
      db.table('images').delete(img.id);
    });

    return sendSuccess(res, { message: 'Product deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('[ProductAdminController@destroy] Error:', error);
    return sendError(res, 'Failed to delete product', 500);
  }
}

module.exports = {
  index,
  show,
  store,
  update,
  destroy
};
