import process from 'process';

import createApp from './app.js';
import config from './config/config.js';
import { closeDB } from './config/database.js';
import { closeRedis } from './config/redis.js';
import logger from './utils/logger.utils.js';

let server;

/**
 * Graceful shutdown helper
 */
const gracefulShutdown = async (signal, err = null) => {
  logger.warn(`🔻 ${signal} received. Shutting down gracefully...`);

  if (err) {
    logger.error('💥 Fatal error triggered graceful shutdown:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  try {
    // 1️⃣ Stop accepting new connections
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('🛑 HTTP server closed.');
    }

    // 2️⃣ Close DB connection pool
    await closeDB();

    // 3️⃣ Close Redis connection (if used)
    await closeRedis?.();

    logger.info('✅ All resources released. Exiting process.');
    process.exit(err ? 1 : 0);
  } catch (shutdownErr) {
    logger.error('❌ Error during graceful shutdown:', shutdownErr);
    process.exit(1);
  }
};

/**
 * App bootstrap
 */
const startServer = async () => {
  try {
    const app = await createApp();

    server = app.listen(config.port, () => {
      logger.info(`✅ Server running on port ${config.port} (${config.env})`);
    });

    // 🧠 Global unhandled promise rejection handler
    process.on('unhandledRejection', async (reason) => {
      logger.error('💥 Unhandled Promise Rejection', {
        reason,
        stack: reason?.stack,
      });
      await gracefulShutdown('unhandledRejection', reason);
    });

    // 🧠 Global uncaught exception handler
    process.on('uncaughtException', async (err) => {
      logger.error('💥 Uncaught Exception', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      await gracefulShutdown('uncaughtException', err);
    });

    // 🧠 OS signal listeners (Docker, Kubernetes, etc.)
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    logger.error('🔥 Fatal startup error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    await gracefulShutdown('startupError', err);
  }
};

startServer();
