/**
 * Innmotek V2 - FAQ Routes
 * 
 * Replaces route in innotek-backend-OLD/routes/api.php:
 * - Route::get('faqs', [FaqController::class, 'index'])
 */

const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');

// FAQs grouped by category
router.get('/faqs', faqController.index);

module.exports = router;
