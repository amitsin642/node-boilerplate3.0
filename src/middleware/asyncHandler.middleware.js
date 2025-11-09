// middlewares/asyncHandler.middleware.js
/**
 * Async Handler Middleware
 * ------------------------
 * Wraps async route handlers to catch errors and forward them
 * to the centralized error handler.
 *
 * Usage:
 *   import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
 *
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await UserService.getAll();
 *     res.json(users);
 *   }));
 */

export const asyncHandler = (fn) => {
  return function asyncUtilWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
