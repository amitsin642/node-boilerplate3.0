// src/loaders/sequelize.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import config from '../config/config.js';
import sequelize, { connectDB } from '../config/database.js';
import logger from '../utils/logger.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {};

export default async function initSequelize(customModelPath = null) {
  try {
    logger.info('⚙️ Initializing Sequelize loader...');

    // Prevent reinitialization
    if (Object.keys(models).length > 0) {
      logger.warn('⚠️ Sequelize already initialized — skipping duplicate model load.');
      return { sequelize, models };
    }

    // 1️⃣ Connect to database
    await connectDB();

    // 2️⃣ Discover model files
    const modelsDir = customModelPath || path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsDir).filter((file) => file.endsWith('.model.js'));

    logger.info(`🔍 Found ${modelFiles.length} model file(s).`);

    // 3️⃣ Dynamically import and define models
    for (const file of modelFiles) {
      const { default: defineModel } = await import(path.join(modelsDir, file));
      const model = defineModel(sequelize);

      if (!model?.name) {
        logger.warn(`⚠️ Skipping invalid model: ${file}`);
        continue;
      }

      models[model.name] = model;
      logger.debug(`📦 Loaded model: ${model.name}`);
    }

    logger.info(`📊 Models loaded: ${Object.keys(models).join(', ') || 'None'}`);

    // 4️⃣ Setup associations
    const assocStart = Date.now();
    Object.values(models).forEach((model) => {
      if (typeof model.associate === 'function') model.associate(models);
    });
    logger.debug(`🔗 Model associations initialized in ${Date.now() - assocStart}ms`);

    // 5️⃣ Optional DB sync (controlled via config flag)
    if (!config.isProduction && config.db.sync !== false) {
      await sequelize.sync({ alter: false });
      logger.info('🛠️ Sequelize models synchronized with DB.');
    }

    // 6️⃣ Post-initialization connection check
    await sequelize.authenticate();
    logger.info('✅ Sequelize connection verified and initialized successfully.');
    logger.info(`✅ Total models loaded: ${Object.keys(models).length}`);

    return { sequelize, models };
  } catch (err) {
    logger.error(`❌ Sequelize loader failed: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
}
