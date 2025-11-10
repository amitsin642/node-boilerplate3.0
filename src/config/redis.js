import { createClient } from 'redis';

import config from './config.js';
import logger from '../utils/logger.utils.js';

let redisClient = null;

/**
 * Connect to Redis
 */
export const connectRedis = async () => {
  const { redis } = config;

  if (!redis?.host && !redis?.url) {
    logger.warn('⚠️ Redis config missing. Skipping Redis connection.');
    return null;
  }

  try {
    const options = redis.url
      ? { url: redis.url }
      : {
          socket: {
            host: redis.host,
            port: redis.port || 6379,
            reconnectStrategy: (retries) => {
              const delay = Math.min(100 * retries, 3000);
              logger.warn(`♻️ Redis reconnect attempt #${retries} — retrying in ${delay}ms...`);
              return delay;
            },
          },
          password: redis.password || undefined,
        };

    redisClient = createClient(options);

    /**
     * 🔊 Event Listeners
     */
    redisClient.on('connect', () => logger.info('✅ Redis connection established.'));
    redisClient.on('ready', () => logger.debug('🚀 Redis client ready for commands.'));
    redisClient.on('end', () => logger.warn('🔌 Redis connection closed.'));
    redisClient.on('reconnecting', () => logger.warn('♻️ Redis reconnecting...'));
    redisClient.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));

    logger.debug(
      redis.url
        ? `⏳ Connecting to Redis via URL...`
        : `⏳ Connecting to Redis at ${redis.host}:${redis.port || 6379}...`
    );

    await redisClient.connect();

    logger.debug('✅ Redis connected and operational.');
    return redisClient;
  } catch (err) {
    logger.error(`❌ Failed to connect to Redis: ${err.message}`);
    logger.debug(err.stack);
    process.exitCode = 1; // Use exitCode instead of exit() (ESLint-safe)
    return null;
  }
};

/**
 * Get Redis client safely
 */
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('❌ Redis client not connected');
  }
  return redisClient;
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('🧹 Redis connection closed gracefully.');
  }
};

export default {
  connectRedis,
  getRedisClient,
  closeRedis,
};
