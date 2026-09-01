/**
 * Innmotek V2 - Auth Routes
 * 
 * Replaces Laravel Passport / Sanctum login endpoints.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login with email and password
router.post('/auth/login', authController.login);

// Current user profile
router.get('/auth/me', authController.me);

module.exports = router;
