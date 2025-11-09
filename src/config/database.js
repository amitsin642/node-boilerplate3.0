import { Sequelize } from 'sequelize';

import config from './config.js';
import logger from '../utils/logger.utils.js';

const {
  db: {
    client,
    url,
    host,
    port,
    user,
    password,
    database,
    pool: { min, max, idle },
  },
} = config;

const commonOptions = {
  dialect: client,
  logging: config.isProduction ? false : (msg) => logger.debug(`[Sequelize] ${msg}`),
  pool: { max, min, idle, acquire: 30000, evict: 10000 },
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true,
  },
  dialectOptions:
    client === 'mysql'
      ? { connectTimeout: 10000 }
      : client === 'postgres'
        ? {
            statement_timeout: 10000,
            idle_in_transaction_session_timeout: 10000,
          }
        : {},
};

const sequelize = url
  ? new Sequelize(url, commonOptions)
  : new Sequelize(database, user, password, { host, port, ...commonOptions });

// Retry-aware DB connection
export const connectDB = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`⏳ Connecting to database (attempt ${attempt}/${retries})...`);
      await sequelize.authenticate();
      logger.info(`✅ Database connection established (${client})`);
      return;
    } catch (err) {
      logger.error(`❌ DB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) {
        logger.error('❌ All DB connection attempts failed. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
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

export default sequelize;
