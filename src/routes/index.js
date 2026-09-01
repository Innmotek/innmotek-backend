/**
 * Innmotek V2 - Master API Router
 * 
 * Replaces innotek-backend-OLD/routes/api.php
 * Mounts all modular feature route groups under /api prefix.
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const bannerRoutes = require('./banner.routes');
const blogRoutes = require('./blog.routes');
const projectRoutes = require('./project.routes');
const serviceRoutes = require('./service.routes');
const testimonialRoutes = require('./testimonial.routes');
const brandRoutes = require('./brand.routes');
const faqRoutes = require('./faq.routes');
const pageRoutes = require('./page.routes');
const pluginRoutes = require('./plugin.routes');

// Health check route
router.get('/health', (req, res) => {
  res.json({
    result: 'success',
    service: 'innmotek-backend-v2',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount authentication & admin management routes
router.use('/', authRoutes);
router.use('/', adminRoutes);

// Mount public frontend endpoints
router.use('/', categoryRoutes);
router.use('/', productRoutes);
router.use('/', bannerRoutes);
router.use('/', blogRoutes);
router.use('/', projectRoutes);
router.use('/', serviceRoutes);
router.use('/', testimonialRoutes);
router.use('/', brandRoutes);
router.use('/', faqRoutes);
router.use('/', pageRoutes);
router.use('/', pluginRoutes);

module.exports = router;
