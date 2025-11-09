import logger from '../utils/logger.utils.js';

/**
 * Custom 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(message);
  res.status(404).json({
    success: false,
    message,
  });
};

/**
 * Centralized Express error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error details
  if (statusCode >= 500) {
    logger.error(`[500] ${err.stack || message}`);
  } else {
    logger.warn(`[${statusCode}] ${message}`);
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors?.map((e) => e.message).join(', ') || 'Validation error';
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = err.details?.map((d) => d.message).join(', ') || 'Validation failed';
  }

  // Handle token-related errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Handle database connection errors
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database connection failed';
  }

  // Standard JSON response
  const response = {
    success: false,
    statusCode,
    message,
  };

  // Include stack only in non-production for debugging
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
