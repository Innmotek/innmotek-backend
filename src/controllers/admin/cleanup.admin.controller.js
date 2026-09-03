/**
 * Innmotek V2 - Admin Data Cleanup & Bulk Purge Controller
 * 
 * Routes Handled:
 *   - GET  /api/admin/cleanup/search -> search()
 *   - POST /api/admin/cleanup/delete -> destroyBulk()
 */

const db = require('../../config/database');
const { sendSuccess, sendError } = require('../../helpers/response.helper');

const MODULE_DEFINITIONS = [
  {
    table: 'products',
    module: 'Products',
    searchFields: ['title', 'slug', 'summary', 'description', 'specification'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'categories',
    module: 'Categories',
    searchFields: ['title', 'slug'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'blogs',
    module: 'Blogs & News',
    searchFields: ['title', 'slug', 'summary', 'description'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'testimonials',
    module: 'Testimonials',
    searchFields: ['full_name', 'company_name', 'message', 'position'],
    titleField: 'full_name',
    subtitleField: 'company_name',
    dateField: 'created_at'
  },
  {
    table: 'subscribers',
    module: 'Subscribers',
    searchFields: ['email', 'slug'],
    titleField: 'email',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'services',
    module: 'Services',
    searchFields: ['title', 'slug', 'summary', 'description'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'projects',
    module: 'Projects',
    searchFields: ['title', 'slug', 'summary', 'description'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  },
  {
    table: 'faqs',
    module: 'FAQs',
    searchFields: ['title', 'description'],
    titleField: 'title',
    subtitleField: 'description',
    dateField: 'created_at'
  },
  {
    table: 'banners',
    module: 'Banners',
    searchFields: ['title', 'link'],
    titleField: 'title',
    subtitleField: 'link',
    dateField: 'created_at'
  },
  {
    table: 'brands',
    module: 'Brands',
    searchFields: ['title', 'link'],
    titleField: 'title',
    subtitleField: 'link',
    dateField: 'created_at'
  },
  {
    table: 'pages',
    module: 'Static Pages',
    searchFields: ['title', 'slug', 'description'],
    titleField: 'title',
    subtitleField: 'slug',
    dateField: 'created_at'
  }
];

/**
 * Universal cross-table search across all modules with date and keyword filters.
 * 
 * Route: GET /api/admin/cleanup/search
 */
function search(req, res) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const moduleFilter = (req.query.module || 'all').toLowerCase();
    const dateFilter = (req.query.dateFilter || 'all').toLowerCase();
    const fromDate = req.query.from ? new Date(req.query.from) : null;
    const toDate = req.query.to ? new Date(req.query.to) : null;

    let targetModules = MODULE_DEFINITIONS;
    if (moduleFilter !== 'all') {
      targetModules = MODULE_DEFINITIONS.filter(m => m.table === moduleFilter || m.module.toLowerCase() === moduleFilter);
    }

    const now = new Date();
    let thresholdDate = null;
    if (dateFilter === 'today') {
      thresholdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === '7days') {
      thresholdDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === '30days') {
      thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const results = [];

    for (const mod of targetModules) {
      const rows = db.table(mod.table).all() || [];

      for (const row of rows) {
        // Date filtering
        const rowDate = row[mod.dateField] ? new Date(row[mod.dateField]) : null;
        if (thresholdDate && (!rowDate || rowDate < thresholdDate)) {
          continue;
        }
        if (fromDate && (!rowDate || rowDate < fromDate)) {
          continue;
        }
        if (toDate && (!rowDate || rowDate > toDate)) {
          continue;
        }

        // Keyword matching
        if (q) {
          const isMatch = mod.searchFields.some(field => {
            const val = row[field];
            return val && String(val).toLowerCase().includes(q);
          });
          if (!isMatch) continue;
        }

        results.push({
          id: row.id,
          table: mod.table,
          module: mod.module,
          title: row[mod.titleField] || `[No ${mod.titleField}]`,
          subtitle: row[mod.subtitleField] ? String(row[mod.subtitleField]).replace(/<[^>]*>/g, '').slice(0, 100) : null,
          created_at: row[mod.dateField] || null,
          status: row.status !== undefined ? row.status : null
        });
      }
    }

    // Sort newest first by default
    results.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return res.status(200).json({
      result: 'success',
      total: results.length,
      items: results
    });
  } catch (error) {
    console.error('[CleanupAdminController@search] Error:', error);
    return sendError(res, 'Failed to search data for cleanup.', 500);
  }
}

/**
 * Bulk delete or purge selected items across different modules/tables.
 * 
 * Route: POST /api/admin/cleanup/delete
 * Body: { items: [{ table: 'products', id: 1 }, { table: 'subscribers', id: 2 }] }
 */
function destroyBulk(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Please select at least one item to delete.', 422);
    }

    const deleted = [];
    const failed = [];

    for (const item of items) {
      if (!item.table || !item.id) continue;
      const success = db.table(item.table).delete(item.id);
      if (success) {
        deleted.push({ table: item.table, id: item.id });
      } else {
        failed.push({ table: item.table, id: item.id });
      }
    }

    return res.status(200).json({
      result: 'success',
      message: `Successfully deleted ${deleted.length} item(s).`,
      deletedCount: deleted.length,
      failedCount: failed.length,
      deleted,
      failed
    });
  } catch (error) {
    console.error('[CleanupAdminController@destroyBulk] Error:', error);
    return sendError(res, 'Failed to delete selected items.', 500);
  }
}

module.exports = {
  search,
  destroyBulk
};
