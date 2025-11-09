import config from './config/config.js';
import logger from './utils/logger.utils.js';
import initLoaders from './loaders/index.js';

/**
 * Initializes and returns the Express app with all dependencies.
 * This function does not start the server — that's handled by server.js.
 */
export default async function createApp() {
  try {
    logger.info(`🚀 Starting ${config.appName} in ${config.env.toUpperCase()} mode...`);

    // Initialize all core loaders: DB, Redis, Express, etc.
    const { app } = await initLoaders();

    logger.info('✅ Application initialized successfully.');
    return app;
  } catch (err) {
    logger.error('❌ Application failed to start:', err.message);
    logger.debug(err.stack);
    process.exit(1);
  }
}
