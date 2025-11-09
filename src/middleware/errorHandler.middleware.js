// src/middleware/errorHandler.middleware.js
import logger from '../utils/logger.utils.js';

/**
 * Custom 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(message);
  res.status(404).json({ success: false, message, timestamp: new Date().toISOString() });
};

/**
 * Centralized Express error handler
 */
export const errorHandler = (err, req, res) => {
  if (!(err instanceof Error)) err = new Error(String(err));

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const response = { success: false, statusCode };
  const requestId = req.id || req.headers['x-request-id'] || null;
  const isOperational = err.isOperational || false;

  // 🧱 AppError support
  if (err.name === 'AppError') {
    statusCode = err.statusCode || 500;
    message = err.message;
    if (err.errorCode) response.errorCode = err.errorCode;
    if (err.details && process.env.NODE_ENV !== 'production') {
      response.details = err.details;
    }
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

  // 🧠 Hide sensitive internals in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = isOperational ? message : 'Internal server error';
  }

  // Log context-rich info
  const logPayload = {
    name: err.name,
    message: err.message,
    code: err.errorCode || null,
    details: err.details || null,
    stack: err.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || null,
    requestId,
  };

  if (statusCode >= 500) {
    logger.error('💥 Server Error', logPayload);
  } else {
    logger.warn(`[${statusCode}] ${message} (${req.method} ${req.originalUrl})`);
  }

  // ✅ Response payload (safe)
  response.message = message;
  response.timestamp = new Date().toISOString();
  if (requestId) response.requestId = requestId;
  if (process.env.NODE_ENV !== 'production') response.stack = err.stack;

  res.status(statusCode).json(response);
};
