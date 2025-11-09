import logger from '../utils/logger.utils.js';

/**
 * Custom 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(message);
  res.status(404).json({ success: false, message });
};

/**
 * Centralized Express error handler
 */
export const errorHandler = (err, req, res, next) => {
  if (!(err instanceof Error)) err = new Error(String(err));

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // 🧱 AppError support
  if (err.name === 'AppError') {
    statusCode = err.statusCode || 500;
    message = err.message;
  }

  // ⚙️ ORM / DB Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors?.map((e) => e.message).join(', ') || 'Validation error';
  }

  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database connection failed';
  }

  // ⚙️ Joi validation
  if (err.isJoi) {
    statusCode = 400;
    message = err.details?.map((d) => d.message).join(', ') || 'Validation failed';
  }

  // ⚙️ Auth / JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Fallback for internal errors in prod
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal server error';
  }

  // Log context-rich info
  if (statusCode >= 500) {
    logger.error('💥 Server Error', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || null,
    });
  } else {
    logger.warn(`[${statusCode}] ${message} (${req.method} ${req.originalUrl})`);
  }

  // Response payload
  const response = {
    success: false,
    statusCode,
    message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
