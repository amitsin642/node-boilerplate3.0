import { connectRedis } from '../config/redis.js';
import logger from '../utils/logger.utils.js';

export default async function initRedis() {
  try {
    logger.info('⚙️ Initializing Redis loader...');
    await connectRedis();
    logger.info('✅ Redis loader initialized successfully.');
  } catch (err) {
    logger.error(`❌ Redis loader initialization failed: ${err.message}`);
    throw err; // allow upper-level loader to handle it
  }
}
