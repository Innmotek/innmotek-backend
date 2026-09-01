/**
 * Innmotek V2 - Product & Featured Routes
 * 
 * Replaces routes in innotek-backend-OLD/routes/api.php:
 * - Route::get('products/{category}', [ProductController::class, 'index'])
 * - Route::get('products/{product}/show', [ProductController::class, 'show'])
 * - Route::get('featured/products', [FeaturedController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const featuredController = require('../controllers/featured.controller');

// Featured products for homepage
router.get('/featured/products', featuredController.index);

// Product detail with explicit /show suffix (as in Laravel api.php)
router.get('/products/:product/show', productController.show);

// Products by category
router.get('/products/:category', productController.index);

// Alias: Product detail without /show suffix (for direct frontend calls)
router.get('/product/:product', productController.show);

module.exports = router;
