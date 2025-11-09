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

  // ✅ mutate the live export object
  Object.assign(db, models, { sequelize, initialized: true });

  // Freeze top-level structure for safety
  Object.freeze(db);
  Object.freeze(db.sequelize);

  logger.info(`✅ Models initialized: ${Object.keys(models).join(', ')}`);
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
