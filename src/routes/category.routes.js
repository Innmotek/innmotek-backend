/**
 * Innmotek V2 - Category Routes
 * 
 * Replaces routes in innotek-backend-OLD/routes/api.php:
 * - Route::get('categories', [CategoryController::class, 'index'])
 * - Route::get('category/{category}', [CategoryController::class, 'show'])
 * - Route::get('products/related/{category}', [CategoryController::class, 'category'])
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Master categories list with nested children
router.get('/categories', categoryController.index);

// Single category subcategories and metadata
router.get('/category/:category', categoryController.show);

// Related products for a category
router.get('/products/related/:category', categoryController.related);

module.exports = router;
