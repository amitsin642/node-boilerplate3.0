import initSequelize from '../loaders/sequelize.js';
import logger from '../utils/logger.utils.js';

const db = {
  sequelize: null,
  initialized: false,
};

/**
 * Initialize Sequelize and models
 */
export const initModels = async () => {
  if (db.initialized) return db;

  const { sequelize, models } = await initSequelize();

  // ✅ mutate the exported object (don’t reassign)
  Object.assign(db, models, { sequelize, initialized: true });

  logger.info('✅ Models initialized and ready.');
  return db;
};

/**
 * Get live DB reference safely
 */
export const getDB = () => {
  if (!db.initialized) {
    throw new Error('❌ Models not initialized — call initModels() first.');
  }
  return db;
};

export default db; // ✅ live reference object
