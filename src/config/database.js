// config/database.js
/**
 * Production-grade Sequelize database configuration and initialization
 *
 * - Uses individual DB credentials (not URL)
 * - Creates a Sequelize instance with connection pooling
 * - Reads connection info from config/config.js
 * - Validates DB connection on startup
 * - Handles graceful shutdowns
 * - Exports the initialized Sequelize instance for app-wide use
 */

import { Sequelize } from 'sequelize';
import config from './config.js';
import logger from '../utils/logger.utils.js';

const {
  db: {
    client,
    host,
    port,
    user,
    password,
    database,
    pool: { min, max, idle },
  },
} = config;

// Initialize Sequelize with credentials
const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: client,
  logging: (msg) => logger.debug(`[Sequelize] ${msg}`),
  pool: {
    max,
    min,
    idle,
    acquire: 30000,
    evict: 10000,
  },
  define: {
    underscored: true, // snake_case columns
    freezeTableName: true, // don't pluralize table names
    timestamps: true, // automatically manage createdAt / updatedAt
  },
  dialectOptions:
    client === 'mysql'
      ? {
          connectTimeout: 10000,
        }
      : client === 'postgres'
      ? {
          statement_timeout: 10000,
          idle_in_transaction_session_timeout: 10000,
        }
      : {},
});

// Connect and verify connection
export const connectDB = async () => {
  try {
    logger.info('⏳ Connecting to database...');
    await sequelize.authenticate();
    logger.info(`✅ Database connection established (${client})`);
  } catch (err) {
    logger.error(`❌ Database connection failed: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
};

// Graceful shutdown
export const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info('🧹 Database connection closed gracefully.');
  } catch (err) {
    logger.error(`⚠️ Error closing DB connection: ${err.message}`);
  }
};

// Handle process termination events
process.on('SIGINT', async () => {
  logger.info('🔻 SIGINT received. Closing DB connection...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🔻 SIGTERM received. Closing DB connection...');
  await closeDB();
  process.exit(0);
});

export default sequelize;
