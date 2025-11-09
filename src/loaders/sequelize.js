import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { connectDB } from '../config/database.js';
import config from '../config/config.js';
import logger from '../utils/logger.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {};

export default async function initSequelize() {
  try {
    logger.info('⚙️ Initializing Sequelize loader...');

    // 1️⃣ Ensure database is connected
    await connectDB();

    // 2️⃣ Load all model files dynamically from /models
    const modelsDir = path.join(__dirname, '../models');

    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((file) => file.endsWith('.model.js'));

    for (const file of modelFiles) {
      const { default: defineModel } = await import(path.join(modelsDir, file));
      const model = defineModel(sequelize);
      models[model.name] = model;
      logger.info(`📦 Loaded model: ${model.name}`);
    }

    // 3️⃣ Setup model associations if defined
    Object.values(models).forEach((model) => {
      if (typeof model.associate === 'function') {
        model.associate(models);
      }
    });

    // 4️⃣ Sync schema only in non-production
    if (config.env !== 'production') {
      await sequelize.sync({ alter: false });
      logger.info('🛠️ Sequelize models synchronized with DB.');
    }

    logger.info(`✅ Sequelize initialized (${Object.keys(models).length} models loaded).`);
    return { sequelize, models };
  } catch (err) {
    logger.error(`❌ Sequelize loader failed: ${err.message}`);
    logger.debug(err.stack);
    process.exit(1);
  }
}
