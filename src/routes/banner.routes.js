/**
 * Innmotek V2 - Banner Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('banners', [BannerController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');

// Banners for hero sliders
router.get('/banners', bannerController.index);

module.exports = router;
