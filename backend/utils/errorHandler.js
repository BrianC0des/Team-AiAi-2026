// ─────────────────────────────────────────────────────────────────────────────
//  errorHandler.js
//  Centralised error utilities for the Express backend.
//
//  Exports:
//    asyncHandler  – wraps async route handlers to forward thrown errors
//    errorMiddleware – global Express error-handling middleware (4-arg signature)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * asyncHandler
 * Wraps an async Express route handler and automatically passes any rejected
 * promise or thrown error to next(), eliminating try/catch boilerplate on
 * every route.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ success: true, data });
 *   }));
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function} Standard Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * errorMiddleware
 * Global Express error-handling middleware. Must be registered LAST in the
 * Express pipeline (after all routes) so it intercepts every forwarded error.
 *
 * Behaviour:
 *  - Logs a clean, timestamped message to the server terminal
 *  - Respects a custom statusCode on the error object (default 500)
 *  - Returns a structured JSON payload regardless of Accept header
 *
 * @param {Error}    err  - Error object forwarded via next(err)
 * @param {Request}  req  - Express request
 * @param {Response} res  - Express response
 * @param {Function} next - Express next (required by Express for 4-arg signature)
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // ── Terminal log ──────────────────────────────────────────────
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  // ── JSON response ─────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = { asyncHandler, errorMiddleware };
