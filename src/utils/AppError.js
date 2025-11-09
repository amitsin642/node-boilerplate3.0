// utils/AppError.js
/**
 * AppError Utility Class
 * ----------------------
 * A standardized error class for operational errors in production.
 *
 * - Helps distinguish between trusted (expected) and programming errors
 * - Works seamlessly with the global errorHandler middleware
 * - Can be safely thrown anywhere in controllers/services
 *
 * Example:
 *   throw new AppError('User not found', 404);
 */

export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // marks error as known (not a bug)

    // Capture stack trace without including this constructor
    Error.captureStackTrace(this, this.constructor);
  }
}
