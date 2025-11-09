import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.utils.js';

const DEFAULT_TTL = 300; // 5 minutes

export const setCache = async (key, value, { ttl = DEFAULT_TTL, namespace = 'default' } = {}) => {
  try {
    const redis = getRedisClient();
    const fullKey = `${namespace}:${key}`;
    await redis.set(fullKey, JSON.stringify(value), { EX: ttl });
    logger.debug(`🧩 Cache set: ${fullKey} (TTL ${ttl}s)`);
  } catch (err) {
    logger.error(`❌ Failed to set cache for ${key}: ${err.message}`);
  }
};

export const getCache = async (key, { namespace = 'default' } = {}) => {
  try {
    const redis = getRedisClient();
    const fullKey = `${namespace}:${key}`;
    const data = await redis.get(fullKey);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`⚠️ Failed to get cache for ${key}: ${err.message}`);
    return null;
  }
};

export const delCache = async (key, { namespace = 'default' } = {}) => {
  try {
    const redis = getRedisClient();
    const fullKey = `${namespace}:${key}`;
    await redis.del(fullKey);
    logger.debug(`🗑️ Cache deleted: ${fullKey}`);
  } catch (err) {
    logger.error(`⚠️ Failed to delete cache for ${key}: ${err.message}`);
  }
};

/**
 * Flush all keys in a namespace
 * e.g., flushNamespace('users') → deletes users:*
 */
export const flushNamespace = async (namespace) => {
  try {
    const redis = getRedisClient();
    const pattern = `${namespace}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(keys);
      logger.info(`🧹 Flushed ${keys.length} keys from namespace: ${namespace}`);
    } else {
      logger.debug(`ℹ️ No keys found for namespace: ${namespace}`);
    }
  } catch (err) {
    logger.error(`⚠️ Failed to flush namespace ${namespace}: ${err.message}`);
  }
};
