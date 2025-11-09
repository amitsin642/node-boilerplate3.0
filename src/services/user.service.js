import db from '../models/index.js';
import { getCache, setCache, flushNamespace, delCache } from '../services/cache.service.js';
import AppError from '../utils/AppError.js';

/**
 * Fetch all active (non-deleted) users
 */
export const getAllUsers = async () => {
  console.log('DB Models:', Object.keys(db)); // should list User + sequelize
  if (!db.User) throw new Error('User model missing from DB');
  const users = await db.User.findAll({
    where: { deleted_at: null },
    attributes: { exclude: ['password'] },
  });
  return users;
};

/**
 * Fetch a user by ID
 */
export const getUserById = async (id) => {
  const cacheKey = `user:${id}`;

  // Try from cache first
  const cached = await getCache(cacheKey, { namespace: 'users' });
  if (cached) return cached;

  // Fallback to DB
  const user = await db.User.findOne({
    where: { id, deleted_at: null },
    attributes: { exclude: ['password'] },
  });
  if (user) {
    await setCache(cacheKey, user, { ttl: 300, namespace: 'users' }); // cache 5 mins
  }
  return user;
};

/**
 * Create a new user
 */
export const createUser = async (data) => {
  // Check for duplicate email
  const existing = await db.User.findOne({ where: { email: data.email } });
  if (existing) throw new AppError('Email already exists', 409);

  const user = await db.User.create(data);
  const { ...safeUser } = user.get({ plain: true });
  return safeUser;
};

/**
 * Update user
 */
export const updateUser = async (id, data) => {
  const user = await db.User.findOne({ where: { id, deleted_at: null } });
  if (!user) return null;

  await user.update(data);
  const { ...updatedUser } = user.get({ plain: true });

  // 🧹 Invalidate caches
  await delCache(`user:${id}`, { namespace: 'users' });
  await flushNamespace('users:list');

  return updatedUser;
};

/**
 * Soft delete user
 */
export const deleteUser = async (id) => {
  const user = await db.User.findOne({ where: { id, deleted_at: null } });
  if (!user) return null;

  await user.update({ deleted_at: new Date() });
  return true;
};
