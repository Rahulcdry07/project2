/**
 * API response utilities
 */

/**
 * Standardizes success responses
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
exports.sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message
    };

    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Standardizes error responses
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 */
exports.sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Creates a standard validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 */
exports.sendValidationError = (res, errors) => {
    return exports.sendError(res, 'Validation error', 400, errors);
};

/**
 * Middleware to handle errors globally
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
    console.error('Global error:', err);
    
    // Check if this is a Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const validationErrors = err.errors.map(error => ({
            field: error.path,
            message: error.message
        }));
        return exports.sendValidationError(res, validationErrors);
    }
    
    // Check if this is a Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const validationErrors = err.errors.map(error => ({
            field: error.path,
            message: error.message
        }));
        return exports.sendValidationError(res, validationErrors);
    }
    
    // Default error handling
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';
    
    return exports.sendError(res, message, statusCode);
};