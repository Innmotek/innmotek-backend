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
const subscriberRoutes = require('./subscriber.routes');

const db = require('../config/database');

// Live Database-Pinging Health Check (prevents Render sleep & Supabase auto-pause)
async function handleHealthCheck(req, res) {
  try {
    const dbStatus = await db.ping();
    return res.status(200).json({
      result: 'success',
      service: 'innmotek-backend-v2',
      status: 'healthy',
      database: {
        status: 'connected',
        provider: dbStatus.provider,
        db_time: dbStatus.db_time,
        latency_ms: dbStatus.latency_ms
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Health Check Error]:', err.message);
    return res.status(503).json({
      result: 'error',
      service: 'innmotek-backend-v2',
      status: 'unhealthy',
      database: {
        status: 'disconnected',
        error: err.message
      },
      timestamp: new Date().toISOString()
    });
  }
}

router.get('/health', handleHealthCheck);

// Direct Live Cache Refresh Hook
router.get('/cache/refresh', async (req, res) => {
  try {
    await db.refreshAllAsync();
    return res.json({
      result: 'success',
      message: 'All tables synced directly from live Supabase PostgreSQL',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ result: 'error', message: err.message });
  }
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
router.use('/subscribers', subscriberRoutes);

module.exports = router;
