// loaders/express.js
/**
 * Production-grade Express app loader
 *
 * - Initializes core Express middleware (CORS, Helmet, Compression)
 * - Parses incoming requests safely
 * - Applies rate limiting & logging
 * - Registers routes
 * - Attaches centralized error handler
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import config from '../config/config.js';
import logger from '../utils/logger.utils.js';
import routes from '../routes/index.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.middleware.js';

export default async function createExpressApp() {
  const app = express();

  /**
   * 🌐 Security & proxy
   */
  if (config.trustProxy) {
    app.set('trust proxy', 1); // e.g., when behind Nginx or AWS ELB
  }

  /**
   * 🧠 Core middleware
   */
  app.use(helmet()); // secure HTTP headers
  app.use(compression()); // gzip compression
  app.use(
    cors({
      origin: config.cors.origin || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // JSON body parser with safe limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /**
   * 🚦 Request logging
   */
  const morganFormat = config.env === 'development' ? 'dev' : 'combined';
  app.use(
    morgan(morganFormat, {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );

  /**
   * ⚙️ Rate Limiter
   */
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    },
  });
  app.use('/api', limiter);

  /**
   * 🩺 Base health check (no auth)
   */
  app.get('/ping', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'pong 🏓',
      environment: config.env,
      uptime: process.uptime(),
    });
  });

  /**
   * 🚀 Register main routes
   * All routes from routes/index.js are prefixed by /api/v1
   */
  app.use('/', routes);

  /**
   * ❌ 404 handler (after routes)
   */
  app.use(notFoundHandler);

  /**
   * 💥 Global error handler (final middleware)
   */
  app.use(errorHandler);

  return app;
}
