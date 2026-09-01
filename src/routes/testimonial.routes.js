/**
 * Innmotek V2 - Testimonial Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('testimonials', [TestimonialController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonial.controller');

// Testimonials list
router.get('/testimonials', testimonialController.index);

module.exports = router;
