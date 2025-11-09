import logger from '../utils/logger.utils.js';
import { initModels, getDB } from '../models/index.js';
import initRedis from './redis.js';
import createExpressApp from './express.js';

/**
 * Bootstraps all loaders and returns initialized components
 */
export default async function initLoaders() {
  logger.info('🚀 Bootstrapping application loaders...');

  try {
    // 1️⃣ Initialize Sequelize (DB + Models)
    await initModels();
    const db = getDB(); // confirm initialized
    logger.info(`✅ Models loaded: ${Object.keys(db).filter(k => k !== 'sequelize').join(', ')}`);


    // 2️⃣ Initialize Redis connection
    await initRedis();

    // 3️⃣ Initialize Express app
    const app = await createExpressApp();

    logger.info('✅ All loaders initialized successfully.');

    return { app, db };
  } catch (err) {
    logger.error(`❌ Loader initialization failed: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
}
