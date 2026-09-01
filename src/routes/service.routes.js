/**
 * Innmotek V2 - Service Routes
 * 
 * Replaces routes in innotek-backend-OLD/routes/api.php:
 * - Route::get('services', [ServiceController::class, 'index'])
 * - Route::get('services/{service}', [ServiceController::class, 'show'])
 */

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

// Services list
router.get('/services', serviceController.index);

// Service detail
router.get('/services/:service', serviceController.show);

module.exports = router;
