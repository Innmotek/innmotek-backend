/**
 * Innmotek V2 - Admin Master API Routes
 * 
 * Replaces Laravel Backend Admin Routes (routes/web.php & backend controllers):
 *   - CategoryController
 *   - ProductController
 *   - BannerController
 *   - BlogController
 *   - ProjectController
 *   - ServiceController
 *   - TestimonialController
 *   - BrandController
 *   - FaqController
 *   - PageController
 * 
 * Mounts all administrative CRUD endpoints under /api/admin.
 */

const express = require('express');
const router = express.Router();

const categoryAdmin = require('../controllers/admin/category.admin.controller');
const productAdmin = require('../controllers/admin/product.admin.controller');
const bannerAdmin = require('../controllers/admin/banner.admin.controller');
const blogAdmin = require('../controllers/admin/blog.admin.controller');
const projectAdmin = require('../controllers/admin/project.admin.controller');
const serviceAdmin = require('../controllers/admin/service.admin.controller');
const testimonialAdmin = require('../controllers/admin/testimonial.admin.controller');
const brandAdmin = require('../controllers/admin/brand.admin.controller');
const faqAdmin = require('../controllers/admin/faq.admin.controller');
const pageAdmin = require('../controllers/admin/page.admin.controller');
const cleanupAdmin = require('../controllers/admin/cleanup.admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Apply JWT authentication guard to all administrative endpoints
router.use('/admin', authenticate);

// Categories
router.get('/admin/categories', categoryAdmin.index);
router.get('/admin/categories/:id', categoryAdmin.show);
router.post('/admin/categories', categoryAdmin.store);
router.put('/admin/categories/:id', categoryAdmin.update);
router.delete('/admin/categories/:id', categoryAdmin.destroy);

// Products
router.get('/admin/products', productAdmin.index);
router.get('/admin/products/:id', productAdmin.show);
router.post('/admin/products', productAdmin.store);
router.put('/admin/products/:id', productAdmin.update);
router.delete('/admin/products/:id', productAdmin.destroy);

// Banners
router.get('/admin/banners', bannerAdmin.index);
router.get('/admin/banners/:id', bannerAdmin.show);
router.post('/admin/banners', bannerAdmin.store);
router.put('/admin/banners/:id', bannerAdmin.update);
router.delete('/admin/banners/:id', bannerAdmin.destroy);

// Blogs
router.get('/admin/blogs', blogAdmin.index);
router.get('/admin/blogs/:id', blogAdmin.show);
router.post('/admin/blogs', blogAdmin.store);
router.put('/admin/blogs/:id', blogAdmin.update);
router.delete('/admin/blogs/:id', blogAdmin.destroy);

// Projects
router.get('/admin/projects', projectAdmin.index);
router.get('/admin/projects/:id', projectAdmin.show);
router.post('/admin/projects', projectAdmin.store);
router.put('/admin/projects/:id', projectAdmin.update);
router.delete('/admin/projects/:id', projectAdmin.destroy);

// Services
router.get('/admin/services', serviceAdmin.index);
router.get('/admin/services/:id', serviceAdmin.show);
router.post('/admin/services', serviceAdmin.store);
router.put('/admin/services/:id', serviceAdmin.update);
router.delete('/admin/services/:id', serviceAdmin.destroy);

// Testimonials
router.get('/admin/testimonials', testimonialAdmin.index);
router.get('/admin/testimonials/:id', testimonialAdmin.show);
router.post('/admin/testimonials', testimonialAdmin.store);
router.put('/admin/testimonials/:id', testimonialAdmin.update);
router.delete('/admin/testimonials/:id', testimonialAdmin.destroy);

// Brands
router.get('/admin/brands', brandAdmin.index);
router.get('/admin/brands/:id', brandAdmin.show);
router.post('/admin/brands', brandAdmin.store);
router.put('/admin/brands/:id', brandAdmin.update);
router.delete('/admin/brands/:id', brandAdmin.destroy);

// FAQs
router.get('/admin/faqs', faqAdmin.index);
router.get('/admin/faqs/:id', faqAdmin.show);
router.post('/admin/faqs', faqAdmin.store);
router.put('/admin/faqs/:id', faqAdmin.update);
router.delete('/admin/faqs/:id', faqAdmin.destroy);

// Static Pages
router.get('/admin/pages', pageAdmin.index);
router.get('/admin/pages/:id', pageAdmin.show);
router.post('/admin/pages', pageAdmin.store);
router.put('/admin/pages/:id', pageAdmin.update);
router.delete('/admin/pages/:id', pageAdmin.destroy);

// Data Cleanup & Bulk Purge
router.get('/admin/cleanup/search', cleanupAdmin.search);
router.post('/admin/cleanup/delete', cleanupAdmin.destroyBulk);

module.exports = router;
