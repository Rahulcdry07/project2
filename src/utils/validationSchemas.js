/**
 * Joi validation schemas for API requests
 */
const Joi = require('joi');

/**
 * Authentication Schemas
 */
const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
        'any.required': 'Username is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 100 characters',
        'any.required': 'Password is required',
      }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  verifyEmail: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Verification token is required',
      }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required',
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 100 characters',
        'any.required': 'Password is required',
      }),
  }),
};

/**
 * Profile Schemas
 */
const profileSchemas = {
  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .optional()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
  }).min(1), // At least one field must be provided
};

/**
 * Admin Schemas
 */
const adminSchemas = {
  updateUserRole: Joi.object({
    role: Joi.string()
      .valid('user', 'admin')
      .required()
      .messages({
        'any.only': 'Role must be either "user" or "admin"',
        'any.required': 'Role is required',
      }),
  }),

  userId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
  }),
};

module.exports = {
  authSchemas,
  profileSchemas,
  adminSchemas,
};
