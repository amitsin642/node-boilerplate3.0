import express from 'express';
import healthRoutes from './health.route.js';
import userRoutes from './user.route.js';
import logger from '../utils/logger.utils.js';

const router = express.Router();

/**
 * 📦 Placeholder for future routes (v1 router)
 */
const v1Router = express.Router();
v1Router.use('/users', userRoutes);
v1Router.use('/health', healthRoutes);

router.use('/api/v1', v1Router);

/**
 * 🧩 Catch-all 404 for undefined API routes
 */
router.use((req, res) => {
  logger.warn(`Unknown route: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router;
