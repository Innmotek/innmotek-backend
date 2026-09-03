/**
 * Innmotek V2 - Subscriber Controller
 * 
 * Routes Handled:
 *   - POST /api/subscribers -> store()
 *   - GET /api/subscribers -> index()
 */

const db = require('../config/database');
const { sendSuccess, sendError } = require('../helpers/response.helper');

/**
 * Register a new subscriber email for technical bulletins.
 * 
 * Route: POST /api/subscribers
 */
function store(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return sendError(res, 'Email address is required.', 422);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return sendError(res, 'Please provide a valid email address.', 422);
    }

    const subscribersTable = db.table('subscribers');
    const existing = subscribersTable.findBy('email', trimmedEmail);

    if (existing) {
      return res.status(200).json({
        result: 'success',
        message: 'This email is already subscribed to Innmotek engineering bulletins.',
        subscriber: {
          id: existing.id,
          email: existing.email
        }
      });
    }

    const slug = trimmedEmail.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const newSubscriber = subscribersTable.insert({
      email: trimmedEmail,
      slug: slug || 'subscriber-' + Date.now(),
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return res.status(201).json({
      result: 'success',
      message: 'Thank you for subscribing to Innmotek technical thermal bulletins!',
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email
      }
    });
  } catch (error) {
    console.error('[SubscriberController@store] Error:', error);
    return sendError(res, 'Failed to process subscription.', 500);
  }
}

/**
 * List all subscribers (Admin / Internal).
 * 
 * Route: GET /api/subscribers
 */
function index(req, res) {
  try {
    const subscribers = db.table('subscribers')
      .orderBy('id', 'desc')
      .get();

    return sendSuccess(res, 'subscribers', subscribers);
  } catch (error) {
    console.error('[SubscriberController@index] Error:', error);
    return sendError(res, 'Failed to fetch subscribers.', 500);
  }
}

module.exports = {
  store,
  index
};
