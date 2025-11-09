// src/utils/responses.utils.js
import logger from './logger.utils.js';

/**
 * Standard success response helper
 */
export const successResponse = (
  res,
  message = 'Request successful',
  data = {},
  statusCode = 200,
  meta = null
) => {
  const response = {
    success: true,
    statusCode,
    message,
    data,
  };

  if (meta) response.meta = meta; // e.g., pagination, totals, etc.

  return res.status(statusCode).json(response);
};

/**
 * Standard error response (fallback for non-caught errors)
 * — Normally global errorHandler handles most errors.
 */
export const errorResponse = (
  res,
  message = 'Something went wrong',
  statusCode = 500,
  error = null
) => {
  logger.error(`[${statusCode}] ${message}`);

  const response = {
    success: false,
    statusCode,
    message,
  };

  // Include stack only in non-production
  if (error && process.env.NODE_ENV !== 'production') {
    response.error =
      typeof error === 'object' ? error.message || JSON.stringify(error) : error;
  }

  return res.status(statusCode).json(response);
};
