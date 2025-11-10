import config from './config/config.js';
import initLoaders from './loaders/index.js';
import logger from './utils/logger.utils.js';

/**
 * Initializes and returns the Express app with all dependencies.
 * This function does not start the server — that's handled by server.js.
 */
export default async function createApp() {
  logger.info(`🚀 Starting ${config.appName} in ${config.env.toUpperCase()} mode...`);
  const startTime = Date.now();

  try {
    // Initialize all core loaders: DB, Redis, Express, etc.
    const { app } = await initLoaders();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`✅ Application initialized successfully in ${duration}s.`);

    return app;
  } catch (err) {
    logger.error(`❌ Application failed to start: ${err.message}`, {
      stack: err.stack,
      env: config.env,
      app: config.appName,
    });
    throw err; // let server.js handle exit
  }
}
