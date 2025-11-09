import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import Joi from 'joi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (if present). In production, env is expected to be set externally.
dotenv.config({
  path: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
});

// Helper parsers
const toInt = (v, fallback) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const normalizeUrl = (url) => (url ? url.trim().replace(/\/+$/, '') : null);

// Joi schema for env validation
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  // App
  APP_NAME: Joi.string().default('my-app'),
  APP_URL: Joi.string().uri().allow('', null),

  // Database (examples for postgres/mysql). Use either DB_URL or individual parts.
  DB_CLIENT: Joi.string().valid('postgres', 'mysql', 'mariadb', 'sqlite').default('mysql'),
  DB_URL: Joi.string().allow('', null),
  DB_HOST: Joi.string().allow('', null),
  DB_PORT: Joi.number().integer().optional(),
  DB_USER: Joi.string().allow('', null),
  DB_PASSWORD: Joi.string().allow('', null),
  DB_NAME: Joi.string().allow('', null),
  DB_POOL_MIN: Joi.number().integer().default(2),
  DB_POOL_MAX: Joi.number().integer().default(10),
  DB_POOL_IDLE: Joi.number().integer().default(10000),

  // JWT / Auth
  JWT_SECRET: Joi.string().min(16).required().disallow(''),
  JWT_ACCESS_EXP: Joi.string().default('15m'),
  JWT_REFRESH_EXP: Joi.string().default('7d'),
  SALT_ROUNDS: Joi.number().integer().default(12),

  // Redis
  REDIS_URL: Joi.string().allow('', null),
  REDIS_HOST: Joi.string().allow('', null),
  REDIS_PORT: Joi.number().integer().optional(),
  REDIS_PASSWORD: Joi.string().allow('', null),

  // Email
  SMTP_HOST: Joi.string().allow('', null),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_USER: Joi.string().allow('', null),
  SMTP_PASS: Joi.string().allow('', null),
  EMAIL_FROM: Joi.string().email().allow('', null),

  // Logging / Sentry
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'verbose', 'debug', 'silly')
    .default('info'),
  SENTRY_DSN: Joi.string().allow('', null),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: Joi.number().integer().default(100),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Feature flags / misc
  ENABLE_SWAGGER: Joi.boolean().default(false),
  TRUST_PROXY: Joi.boolean().default(false),
}).unknown(true); // allow extra envs

// Validate process.env against schema
const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
});
if (error) {
  // Fail fast — config should not be invalid in production
  // Keep message readable for logs
  // eslint-disable-next-line no-console
  console.error('Config validation error:', error.details.map((d) => d.message).join(', '));
  throw new Error('Invalid environment variables. See logs for details.');
}

// Construct DB config: prefer DB_URL if provided, else individual components
const dbConfig = {
  client: envVars.DB_CLIENT,
  url: envVars.DB_URL || null,
  host: envVars.DB_HOST || null,
  port: envVars.DB_PORT ? toInt(envVars.DB_PORT) : undefined,
  user: envVars.DB_USER || null,
  password: envVars.DB_PASSWORD || null,
  database: envVars.DB_NAME || null,
  sync: envVars.DB_SYNC === 'true' || false,
  pool: {
    min: toInt(envVars.DB_POOL_MIN, 2),
    max: toInt(envVars.DB_POOL_MAX, 10),
    idle: toInt(envVars.DB_POOL_IDLE, 10000),
  },
};

// Build final config object
const config = {
  env: envVars.NODE_ENV,
  isDev: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
  port: toInt(envVars.PORT, 3000),
  appName: envVars.APP_NAME,
  appUrl: normalizeUrl(envVars.APP_URL),
  rootDir: path.resolve(__dirname, '..'),
  // db
  db: dbConfig,

  // auth
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpiration: envVars.JWT_ACCESS_EXP,
    refreshExpiration: envVars.JWT_REFRESH_EXP,
    saltRounds: toInt(envVars.SALT_ROUNDS, 12),
  },

  // redis
  redis: {
    url: normalizeUrl(envVars.REDIS_URL) || null,
    host: envVars.REDIS_HOST || null,
    port: envVars.REDIS_PORT ? toInt(envVars.REDIS_PORT) : undefined,
    password: envVars.REDIS_PASSWORD || null,
  },

  // mail
  mail: {
    host: envVars.SMTP_HOST || null,
    port: envVars.SMTP_PORT ? toInt(envVars.SMTP_PORT) : undefined,
    user: envVars.SMTP_USER || null,
    pass: envVars.SMTP_PASS || null,
    from: envVars.EMAIL_FROM || `no-reply@${envVars.APP_NAME || 'example.com'}`,
  },

  // logging
  logging: {
    level: envVars.LOG_LEVEL,
    sentryDsn: envVars.SENTRY_DSN || null,
  },

  // rate-limiting and security
  rateLimit: {
    windowMs: toInt(envVars.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(envVars.RATE_LIMIT_MAX, 100),
  },

  // cors
  cors: {
    origin: envVars.CORS_ORIGIN,
  },

  // features & misc
  features: {
    swagger: !!envVars.ENABLE_SWAGGER,
  },

  trustProxy: !!envVars.TRUST_PROXY,

  // expose raw env for advanced usage (read-only)
  _rawEnv: Object.freeze(envVars),
};

// Freeze the config to avoid accidental mutation
Object.freeze(config);
Object.freeze(config.db);
Object.freeze(config.jwt);
Object.freeze(config.redis);
Object.freeze(config.mail);
Object.freeze(config.logging);
Object.freeze(config.rateLimit);
Object.freeze(config.cors);
Object.freeze(config.features);

export default config;
