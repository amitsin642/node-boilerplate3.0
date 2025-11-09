import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.utils.js';

const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute default
const MAX_REQUESTS = 30; // default requests per window

/**
 * Creates a rate limiting middleware
 *
 * @param {object} options
 * @param {number} [options.window=60] - Time window in seconds
 * @param {number} [options.max=30] - Max requests allowed in the window
 * @param {string} [options.namespace='rate'] - Redis key namespace
 * @param {function} [options.keyGenerator] - Custom key generator (e.g. user ID)
 */
export const rateLimitMiddleware = (options = {}) => {
  const {
    window = WINDOW_SIZE_IN_SECONDS,
    max = MAX_REQUESTS,
    namespace = 'rate',
    keyGenerator,
  } = options;

  return async (req, res, next) => {
    try {
      const redis = getRedisClient();

      // Identify the request source (default by IP)
      const identifier =
        typeof keyGenerator === 'function'
          ? keyGenerator(req)
          : req.ip || req.headers['x-forwarded-for'] || 'unknown';

      const key = `${namespace}:${identifier}`;
      const now = Math.floor(Date.now() / 1000);

      const ttl = await redis.ttl(key);
      const count = await redis.incr(key);

      if (count === 1) {
        // first request — set expiry
        await redis.expire(key, window);
      }

      const remainingTime = ttl > 0 ? ttl : window;
      const remainingRequests = Math.max(0, max - count);

      // If over the limit
      if (count > max) {
        res.set('Retry-After', remainingTime);
        logger.warn(`🚫 Rate limit exceeded for ${identifier} — ${count} requests in ${window}s`);
        return res.status(429).json({
          success: false,
          message: `Too many requests. Try again in ${remainingTime}s.`,
          retry_after: remainingTime,
        });
      }

      // Attach rate limit info for response headers
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', remainingRequests);
      res.set('X-RateLimit-Reset', now + remainingTime);

      next();
    } catch (err) {
      // Graceful fallback if Redis is unavailable
      logger.error(`⚠️ Rate limiter error: ${err.message}`);
      next();
    }
  };
};

export default rateLimitMiddleware;
