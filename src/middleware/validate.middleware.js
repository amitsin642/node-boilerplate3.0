// middlewares/validate.middleware.js
/**
 * Joi Validation Middleware
 * -------------------------
 * Validates request payloads (body, query, params, headers) using Joi schemas.
 *
 * - Integrates with global error handler
 * - Prevents invalid requests from reaching controllers
 * - Supports partial validation (validate only what you define)
 *
 * Usage:
 *   import { validate } from '../middlewares/validate.middleware.js';
 *   import { createUserSchema } from '../validations/user.validation.js';
 *
 *   router.post('/', validate(createUserSchema), userController.createUser);
 */

import Joi from 'joi';
import AppError from '../utils/AppError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Check if schema is provided
      if (!schema) {
        throw new AppError('Validation schema not provided', 500);
      }

      const validSections = ['body', 'query', 'params', 'headers'];
      const validationResults = {};

      for (const section of validSections) {
        if (schema[section]) {
          const { error, value } = schema[section].validate(req[section], {
            abortEarly: false, // return all errors, not just first
            allowUnknown: true, // allow unknown fields (configurable)
            stripUnknown: true, // remove unknown fields
          });

          if (error) {
            // Combine all messages into a single readable string
            const message = error.details.map((d) => d.message).join(', ');
            throw new AppError(`Validation error in ${section}: ${message}`, 400);
          }

          validationResults[section] = value;
        }
      }

      // Replace request sections with validated and sanitized data
      for (const section of Object.keys(validationResults)) {
        req[section] = validationResults[section];
      }

      return next();
    } catch (err) {
      next(err);
    }
  };
};
