import createExpressApp from './express.js';
import initRedis from './redis.js';
import { initModels, getDB } from '../models/index.js';
import logger from '../utils/logger.utils.js';

/**
 * Bootstraps all loaders and returns initialized components
 */
export default async function initLoaders() {
  logger.debug('🚀 Bootstrapping application loaders...');

  try {
    // 1️⃣ Initialize Sequelize (DB + Models)
    await initModels();
    const db = getDB(); // confirm initialized
    logger.debug(
      `✅ Models loaded: ${Object.keys(db)
        .filter((k) => k !== 'sequelize')
        .join(', ')}`
    );

    // 2️⃣ Initialize Redis connection
    await initRedis();

    // 3️⃣ Initialize Express app
    const app = await createExpressApp();

    logger.debug('✅ All loaders initialized successfully.');

    return { app, db };
  } catch (err) {
    logger.error(`❌ Loader initialization failed: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
}
