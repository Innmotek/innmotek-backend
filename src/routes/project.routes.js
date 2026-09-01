/**
 * Innmotek V2 - Project Routes
 * 
 * Replaces routes in innotek-backend-OLD/routes/api.php:
 * - Route::get('projects', [ProjectController::class, 'index'])
 * - Route::get('projects/{project}', [ProjectController::class, 'show'])
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

// Portfolio list
router.get('/projects', projectController.index);

// Project case study detail
router.get('/projects/:project', projectController.show);

module.exports = router;
