import createApp from './app.js';
import config from './config/config.js';
import logger from './utils/logger.utils.js';

let server;

const startServer = async () => {
  try {
    const app = await createApp();

    server = app.listen(config.port, () => {
      logger.info(`✅ Server running on port ${config.port} (${config.env})`);
    });

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('💥 Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    // Catch uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('🔥 Fatal startup error:', err); // <-- console fallback
    logger?.error?.(`🔥 Fatal startup error: ${err.message}`);
    process.exit(1);
  }
};

startServer();
