/**
 * Innmotek V2 - API Response Helper
 * 
 * Standardizes all outgoing API responses to match API_SPEC.md exactly:
 * - Successful responses wrapped in {"result": "success", ...payload}
 * - Error responses wrapped in {"result": "error", "message": ...}
 */

/**
 * Send a standardized success response.
 * 
 * @param {import('express').Response} res - Express response object
 * @param {string|object} keyOrPayload - Data key string (e.g. 'categories') or object with multiple keys
 * @param {any} [data] - Data payload if key was specified as first parameter
 * @param {number} [statusCode=200] - HTTP status code
 */
function sendSuccess(res, keyOrPayload, data, statusCode = 200) {
  if (typeof keyOrPayload === 'object' && keyOrPayload !== null) {
    return res.status(statusCode).json({
      result: 'success',
      ...keyOrPayload
    });
  }

  return res.status(statusCode).json({
    result: 'success',
    [keyOrPayload]: data
  });
}

/**
 * Send a standardized error response.
 * 
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Human-readable error description
 * @param {number} [statusCode=400] - HTTP status code
 */
function sendError(res, message = 'An error occurred', statusCode = 400) {
  return res.status(statusCode).json({
    result: 'error',
    message
  });
}

module.exports = {
  sendSuccess,
  sendError
};
