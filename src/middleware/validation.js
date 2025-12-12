/**
 * Request validation middleware using Joi
 */
const logger = require('../utils/logger');

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi schema object
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // eslint-disable-next-line security/detect-object-injection
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errorMessage = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Request validation failed', { 
        path: req.path, 
        property, 
        errors: errorMessage 
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessage,
      });
    }

    // Replace request property with validated value
    // eslint-disable-next-line security/detect-object-injection
    req[property] = value;
    next();
  };
};

module.exports = { validate };
