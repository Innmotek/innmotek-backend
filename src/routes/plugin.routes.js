/**
 * Innmotek V2 - Plugin Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('plugins', [PluginController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const pluginController = require('../controllers/plugin.controller');

// Plugins and tracking script tags
router.get('/plugins', pluginController.index);

module.exports = router;
