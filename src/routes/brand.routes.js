/**
 * Innmotek V2 - Brand Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('brands', [BrandController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

// Brands list
router.get('/brands', brandController.index);

module.exports = router;
