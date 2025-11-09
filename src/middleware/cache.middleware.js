/**
 * Response Caching Middleware (Production-Ready)
 * ----------------------------------------------
 * - Caches successful GET responses in Redis
 * - Skips cache for unsafe HTTP methods
 * - Supports TTL and namespace options
 * - Uses ETag headers for conditional responses
 */

import crypto from 'crypto';

import { getCache, setCache } from '../services/cache.service.js';
import logger from '../utils/logger.utils.js';

/**
 * Create cache middleware for GET routes
 *
 * @param {object} options
 * @param {number} [options.ttl=60] - Cache lifetime in seconds
 * @param {string} [options.namespace='http'] - Namespace for Redis keys
 * @param {function} [options.keyGenerator] - Optional custom cache key function
 */
export const cacheMiddleware = (options = {}) => {
  const { ttl = 60, namespace = 'http', keyGenerator } = options;

  return async (req, res, next) => {
    try {
      if (req.method !== 'GET') return next(); // only cache GETs

      // Build a unique cache key
      const key = typeof keyGenerator === 'function' ? keyGenerator(req) : `${req.originalUrl}`;

      const cacheKey = crypto.createHash('sha1').update(`${namespace}:${key}`).digest('hex');

      // Try Redis cache
      const cachedData = await getCache(cacheKey, { namespace });
      if (cachedData) {
        logger.debug(`💾 Cache hit: ${req.originalUrl}`);

        // Handle ETag (if client supports it)
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && cachedData.etag === ifNoneMatch) {
          return res.status(304).end(); // Not modified
        }

        res.set('ETag', cachedData.etag);
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cachedData.payload);
      }

      // Monkey-patch res.json to capture and cache response
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          // Generate ETag
          const etag = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');

          // Store in Redis
          await setCache(cacheKey, { etag, payload: body }, { ttl, namespace });

          res.set('ETag', etag);
          res.set('X-Cache', 'MISS');
        } catch (cacheErr) {
          logger.error(`⚠️ Failed to cache response for ${req.originalUrl}: ${cacheErr.message}`);
        }

        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error(`❌ Cache middleware error: ${err.message}`);
      next(); // don’t block requests on cache errors
    }
  };
};

export default cacheMiddleware;
