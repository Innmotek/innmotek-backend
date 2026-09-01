/**
 * Innmotek V2 - Blog Routes
 * 
 * Replaces routes in innotek-backend-OLD/routes/api.php:
 * - Route::get('blogs', [BlogController::class, 'index'])
 * - Route::get('blogs/{blog}', [BlogController::class, 'show'])
 * - Route::get('blogs/categories/{blog_category}', [BlogController::class, 'category'])
 */

const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');

// Blogs list (supports ?limit=N)
router.get('/blogs', blogController.index);

// Blog category filter
router.get('/blogs/categories/:category', blogController.category);

// Blog detail reader
router.get('/blogs/:blog', blogController.show);

module.exports = router;
