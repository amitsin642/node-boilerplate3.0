// routes/index.js
import express from 'express';
import healthRoutes from './health.route.js';
import userRoutes from './user.route.js';
import logger from '../utils/logger.utils.js';

const router = express.Router();

/**
 * 🩺 Health route
 */
// router.use('/api/v1/health', healthRoutes);

/**
 * 📦 Placeholder for future routes (v1 router)
 */
const v1Router = express.Router();
v1Router.use('/users', userRoutes);
// v1Router.use('/auth', authRoutes);
v1Router.use('/health', healthRoutes);

router.use('/api/v1', v1Router);

/**
 * 🧩 Catch-all 404 for undefined API routes
 * (Express v5-safe syntax)
 */
router.use((req, res) => {
  logger.warn(`Unknown route: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router;
