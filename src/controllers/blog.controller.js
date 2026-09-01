/**
 * Innmotek V2 - Blog Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Frontend\Blog\BlogController
 * 
 * Routes Handled:
 *   - GET /api/blogs -> index() (supports ?limit= query param)
 *   - GET /api/blogs/:blog -> show()
 *   - GET /api/blogs/categories/:category -> category()
 * 
 * Behavior & Match:
 * - Queries active blogs (status = 1, ordered by id desc)
 * - Returns exact API_SPEC.md response shapes for listing, reader, and category filtering
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');
const {
  formatBlogList,
  formatBlogDetail,
  formatBlogCategories,
  formatBlogCategoryDetail
} = require('../helpers/blog.helper');

/**
 * List all active blogs with optional limit parameter.
 * 
 * Route: GET /api/blogs
 */
function index(req, res) {
  try {
    let query = db.table('blogs')
      .where('status', 1)
      .orderBy('id', 'desc');

    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      query = query.take(Number(req.query.limit));
    }

    const blogs = query.get();
    const formattedBlogs = formatBlogList(blogs);

    return sendSuccess(res, 'blogs', formattedBlogs);
  } catch (error) {
    console.error('[BlogController@index] Error:', error);
    return sendError(res, 'Failed to fetch blogs', 500);
  }
}

/**
 * Show a single blog article with sidebar categories and related articles.
 * 
 * Route: GET /api/blogs/:blog (blog slug or ID)
 */
function show(req, res) {
  try {
    const blogParam = req.params.blog;

    const blog = db.table('blogs')
      .where('slug', blogParam)
      .first() || db.table('blogs').find(blogParam);

    if (!blog) {
      return sendError(res, 'Blog article not found', 404);
    }

    // Recent blogs in same category (up to 5)
    const relatedBlogs = db.table('blogs')
      .where('status', 1)
      .where('category_id', blog.category_id)
      .orderBy('id', 'desc')
      .take(5)
      .get();

    // Active blog categories for sidebar navigation
    const categories = db.table('blog_categories')
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedBlog = formatBlogDetail(blog);
    const formattedRelated = formatBlogList(relatedBlogs);
    const formattedCategories = formatBlogCategories(categories);

    return sendSuccess(res, {
      blog: formattedBlog,
      blogs: formattedRelated,
      categories: formattedCategories
    });
  } catch (error) {
    console.error('[BlogController@show] Error:', error);
    return sendError(res, 'Failed to fetch blog article', 500);
  }
}

/**
 * List blogs filtered by category.
 * 
 * Route: GET /api/blogs/categories/:category (category slug or ID)
 */
function category(req, res) {
  try {
    const categoryParam = req.params.category;

    const blogCategory = db.table('blog_categories')
      .where('slug', categoryParam)
      .first() || db.table('blog_categories').find(categoryParam);

    if (!blogCategory) {
      return sendError(res, 'Blog category not found', 404);
    }

    const blogs = db.table('blogs')
      .where('category_id', blogCategory.id)
      .where('status', 1)
      .orderBy('id', 'desc')
      .get();

    const formattedBlogs = formatBlogList(blogs);
    const formattedCat = formatBlogCategoryDetail(blogCategory);

    return sendSuccess(res, {
      blogs: formattedBlogs,
      category: formattedCat
    });
  } catch (error) {
    console.error('[BlogController@category] Error:', error);
    return sendError(res, 'Failed to fetch blogs for category', 500);
  }
}

module.exports = {
  index,
  show,
  category
};
