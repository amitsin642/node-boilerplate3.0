import express from 'express';

import { asyncHandler } from '../middleware/asyncHandler.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as userController from '../controllers/user.controller.js';
import * as userValidation from '../validations/user.validation.js';

const router = express.Router();

router.get('/', asyncHandler(userController.getAllUsers));
router.get(
  '/:id',
  validate(userValidation.userIdParamSchema),
  asyncHandler(userController.getUserById)
);
router.post(
  '/',
  validate(userValidation.createUserSchema),
  asyncHandler(userController.createUser)
);
router.put(
  '/:id',
  validate(userValidation.updateUserSchema),
  asyncHandler(userController.updateUser)
);
router.delete(
  '/:id',
  validate(userValidation.userIdParamSchema),
  asyncHandler(userController.deleteUser)
);

export default router;
