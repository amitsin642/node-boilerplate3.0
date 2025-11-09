// loaders/redis.js
/**
 * Redis Loader
 * ------------
 * - Initializes Redis connection using config/redis.js
 * - Ensures connection is ready before proceeding
 * - Logs connection status
 * - Provides a clean way to plug into loader system
 */

import { connectRedis } from '../config/redis.js';
import logger from '../utils/logger.utils.js';

export default async function initRedis() {
  try {
    logger.info('⚙️ Initializing Redis loader...');
    await connectRedis();
    logger.info('✅ Redis loader initialized successfully.');
  } catch (err) {
    logger.error(`❌ Redis loader initialization failed: ${err.message}`);
    throw err; // Let higher-level loader or server handle the failure
  }
}
