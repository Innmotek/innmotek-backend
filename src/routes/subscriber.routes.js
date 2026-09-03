/**
 * Innmotek V2 - Subscriber Routes
 * 
 * Mounts:
 *   - POST /api/subscribers
 *   - GET  /api/subscribers
 */

const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

router.post('/', subscriberController.store);
router.get('/', subscriberController.index);

module.exports = router;
