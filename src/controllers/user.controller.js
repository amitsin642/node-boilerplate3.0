import * as responses from '../utils/responses.utils.js';
import { asyncHandler } from '../middleware/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';
import * as userService from '../services/user.service.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return responses.successResponse(res, 'Users fetched successfully', users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw new AppError('User not found', 404, { id: 101 }, 'USER_NOT_FOUND');
  return responses.successResponse(res, 'User fetched successfully', user);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return responses.successResponse(res, 'User created successfully', user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  if (!updatedUser) throw new AppError('User not found', 404);
  return responses.successResponse(res, 'User updated successfully', updatedUser);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await userService.deleteUser(req.params.id);
  if (!deleted) throw new AppError('User not found', 404);
  return responses.successResponse(res, 'User deleted successfully');
});
