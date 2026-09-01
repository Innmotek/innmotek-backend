/**
 * Innmotek V2 - Authentication & RBAC Middleware
 * 
 * Protects all administrative routes:
 * 1. Validates presence and format of 'Authorization: Bearer <token>' header
 * 2. Cryptographically verifies JWT signature against process.env.JWT_SECRET
 * 3. Enforces token expiration
 * 4. Checks against decommissioned vendor blacklists (appmero.com, infinityinfosys.com)
 * 5. Attaches authenticated user identity & permissions to req.user
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendError } = require('../helpers/response.helper');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('[Security Exception] JWT_SECRET must be defined in .env for production.');
  }
  return secret || 'innmotek_v2_dev_jwt_secret_change_in_production_2026';
}

const DISALLOWED_VENDOR_EMAILS = [
  'email@appmero.com',
  'support@infinityinfosys.com'
];

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Unauthorized - Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return sendError(res, 'Unauthorized - Bearer token missing', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Unauthorized - Session token expired. Please log in again.', 401);
      }
      return sendError(res, 'Unauthorized - Invalid or tampered token', 401);
    }

    // Lookup user in database
    const user = db.table('users').find(decoded.userId);
    if (!user) {
      return sendError(res, 'Unauthorized - User account does not exist', 401);
    }

    // Security Gate: Reject decommissioned legacy vendor accounts
    if (DISALLOWED_VENDOR_EMAILS.includes(user.email.toLowerCase())) {
      return sendError(res, 'Account access revoked. Decommissioned vendor account.', 403);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: decoded.role || 'super admin'
    };

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return sendError(res, 'Authentication failed due to an internal error', 500);
  }
}

module.exports = {
  authenticate,
  getJwtSecret
};
