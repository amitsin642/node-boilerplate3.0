// src/server.js
import createApp from './app.js';
import config from './config/config.js';
import logger from './utils/logger.utils.js';
import { closeDB } from './config/database.js';
import { closeRedis } from './config/redis.js';

let server;

// Catch uncaught exceptions early
process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught Exception! Shutting down...');
  logger.error(err);
  process.exit(1);
});

const startServer = async () => {
  try {
    const app = await createApp();
    const startTime = Date.now();

    server = app.listen(config.port, () => {
      const bootTime = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Server ready in ${bootTime}s on port ${config.port} (${config.env})`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} already in use.`);
      } else {
        logger.error(`❌ Server error: ${err.message}`);
      }
      process.exit(1);
    });

    // Handle rejections gracefully
    process.on('unhandledRejection', (err) => {
      logger.error('💥 Unhandled Rejection! Shutting down...');
      logger.error(err);
      server.close(() => process.exit(1));
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`🔻 ${signal} received. Closing resources...`);
      await closeDB();
      await closeRedis();
      server.close(() => {
        logger.info('🧹 HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (err) {
    logger.error(`🔥 Fatal startup error: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
