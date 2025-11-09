import { createClient } from 'redis';
import config from './config.js';
import logger from '../utils/logger.utils.js';

let redisClient = null;

export const connectRedis = async () => {
  try {
    const { redis } = config;
    const options = {
      socket: {
        host: redis.host,
        port: redis.port || 6379,
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`⚠️ Redis reconnect attempt #${retries}, retrying in ${delay}ms...`);
          return delay;
        },
      },
    };

    if (redis.password) options.password = redis.password;

    logger.info(`⏳ Connecting to Redis at ${redis.host}:${redis.port || 6379}...`);
    redisClient = createClient(options);

    redisClient.on('connect', () => logger.info('✅ Redis connection established.'));
    redisClient.on('ready', () => logger.info('🚀 Redis client ready for commands.'));
    redisClient.on('end', () => logger.warn('🔌 Redis connection closed.'));
    redisClient.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));

    await redisClient.connect();
    logger.info('✅ Redis loader initialized successfully.');
  } catch (err) {
    logger.error(`❌ Failed to connect to Redis: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
};

/**
 * Return current Redis client instance
 */
export const getRedisClient = () => redisClient;

export const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('🧹 Redis connection closed gracefully.');
  }
};

export default { connectRedis, getRedisClient, closeRedis };
