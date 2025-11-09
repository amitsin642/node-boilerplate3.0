import express from 'express';
import config from '../config/config.js';
import sequelize from '../config/database.js';
import { getRedisClient } from '../config/redis.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    success: true,
    app: config.appName,
    environment: config.env,
    version: 'v1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {},
  };

  // ✅ Check DB
  try {
    await sequelize.authenticate({ logging: false });
    health.services.database = { status: 'up', message: 'Database connection OK' };
  } catch (err) {
    health.services.database = { status: 'down', message: err.message };
    health.success = false;
  }

  // ✅ Check Redis
  try {
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.services.redis = { status: 'up', message: 'Redis connection OK' };
    } else {
      health.services.redis = { status: 'down', message: 'Redis client not connected' };
      health.success = false;
    }
  } catch (err) {
    health.services.redis = { status: 'down', message: err.message };
    health.success = false;
  }

  const statusCode = health.success ? 200 : 503;
  return res.status(statusCode).json(health);
});

export default router;
