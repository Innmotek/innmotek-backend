/**
 * Innmotek V2 - Page Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('pages/{page}', [PageController::class, 'show'])
 */

const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');

// Show static/policy page
router.get('/pages/:page', pageController.show);

module.exports = router;
