import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';

import logger from '../utils/logger.utils.js';

const router = express.Router();
const v1Router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesDir = path.join(__dirname, './'); // current directory

/**
 * 🔍 Dynamically import all .route.js files from routes directory
 */
const loadRoutes = async () => {
  const files = fs.readdirSync(routesDir).filter((file) => file.endsWith('.route.js'));

  for (const file of files) {
    try {
      const routeModule = await import(path.join(routesDir, file));
      const routeName = file.replace('.route.js', '');

      const mountPath = `/${routeName}`;
      v1Router.use(mountPath, routeModule.default);

      logger.debug(`🧩 Mounted v1 route: ${mountPath}`);
    } catch (err) {
      logger.error(`❌ Failed to load route file: ${file} — ${err.message}`);
    }
  }
};

// Immediately load routes (top-level await alternative)
await loadRoutes();

/**
 * 📦 Mount versioned router
 */
router.use('/api/v1', v1Router);

/**
 * 🧩 Catch-all 404 handler
 */
router.use((req, res) => {
  logger.warn(`Unknown route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

export default router;
