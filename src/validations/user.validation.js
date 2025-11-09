import Joi from 'joi';

export const createUserSchema = {
  body: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};

export const updateUserSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
  }).min(1), // at least one field required
};

export const userIdParamSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};
