/**
 * Enhanced validation middleware using express-validator
 */
const { body, param, query, validationResult } = require('express-validator');
const { sendValidationError } = require('../utils/apiResponse');

/**
 * Middleware to handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));
        
        return sendValidationError(res, { 
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    next();
};

/**
 * User registration validation rules
 */
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters long')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores')
        .custom(async (value) => {
            // Additional custom validation can be added here
            if (value.toLowerCase() === 'admin' || value.toLowerCase() === 'root') {
                throw new Error('Username not allowed');
            }
            return true;
        }),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters')
        .custom(async (value) => {
            // Check for common disposable email providers
            const disposableProviders = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
            const domain = value.split('@')[1];
            if (disposableProviders.includes(domain)) {
                throw new Error('Disposable email addresses are not allowed');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
        .custom((value) => {
            // Check for common weak passwords
            const weakPasswords = ['password', '12345678', 'qwerty123', 'password123'];
            if (weakPasswords.includes(value.toLowerCase())) {
                throw new Error('Password is too common. Please choose a stronger password');
            }
            return true;
        })
];

/**
 * User login validation rules
 */
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ max: 128 })
        .withMessage('Password too long')
];

/**
 * Password reset validation rules
 */
const validatePasswordReset = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required')
        .isLength({ min: 32, max: 256 })
        .withMessage('Invalid reset token format'),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

/**
 * Forgot password validation rules
 */
const validateForgotPassword = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters')
];

/**
 * Change password validation rules
 */
const validateChangePassword = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .isLength({ max: 128 })
        .withMessage('Password too long'),
    
    body('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('New password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
        .custom((value, { req }) => {
            if (value === req.body.oldPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
];

/**
 * Profile update validation rules
 */
const validateProfileUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters long')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters')
        .custom((value) => {
            // Remove potentially harmful content
            if (value && /<script|javascript:|data:/i.test(value)) {
                throw new Error('Bio contains potentially harmful content');
            }
            return true;
        }),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters')
        .matches(/^[a-zA-Z0-9\s,.-]+$/)
        .withMessage('Location contains invalid characters'),
    
    body('website')
        .optional()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Please provide a valid website URL')
        .isLength({ max: 255 })
        .withMessage('Website URL must be less than 255 characters'),
    
    body('github_url')
        .optional()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Please provide a valid GitHub URL')
        .custom((value) => {
            if (value && !value.includes('github.com')) {
                throw new Error('Must be a valid GitHub URL');
            }
            return true;
        }),
    
    body('linkedin_url')
        .optional()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Please provide a valid LinkedIn URL')
        .custom((value) => {
            if (value && !value.includes('linkedin.com')) {
                throw new Error('Must be a valid LinkedIn URL');
            }
            return true;
        }),
    
    body('twitter_url')
        .optional()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Please provide a valid Twitter URL')
        .custom((value) => {
            if (value && !(value.includes('twitter.com') || value.includes('x.com'))) {
                throw new Error('Must be a valid Twitter/X URL');
            }
            return true;
        })
];

/**
 * Admin user update validation rules
 */
const validateAdminUserUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid user ID is required'),
    
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either "user" or "admin"'),
    
    body('is_verified')
        .optional()
        .isBoolean()
        .withMessage('Verification status must be a boolean')
];

/**
 * Search and pagination validation rules
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Page must be a positive integer between 1 and 10000'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'username', 'email'])
        .withMessage('Invalid sort field'),
    
    query('order')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .withMessage('Order must be ASC or DESC')
];

/**
 * Search query validation
 */
const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Search query must be 1-255 characters long')
        .custom((value) => {
            // Prevent potentially dangerous search patterns
            if (/[<>{}[\]\\]/g.test(value)) {
                throw new Error('Search query contains invalid characters');
            }
            return true;
        })
];

/**
 * File upload validation
 */
const validateFileUpload = [
    body('filename')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Filename must be less than 255 characters')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Filename contains invalid characters')
];

/**
 * Generic ID parameter validation
 */
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required')
];

/**
 * Sanitization middleware to clean input data
 */
const sanitizeInput = (req, res, next) => {
    // Recursively sanitize request body
    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        sanitizeObject(req.query);
    }
    
    next();
};

/**
 * Helper function to sanitize object recursively
 * @param {Object} obj - Object to sanitize
 */
function sanitizeObject(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            // Remove null bytes and control characters
            obj[key] = obj[key].replace(/\\0/g, '').replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
            
            // Limit string length to prevent DoS
            if (obj[key].length > 10000) {
                obj[key] = obj[key].substring(0, 10000);
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}

/**
 * Rate limiting validation for sensitive endpoints
 */
const validateSensitiveOperation = [
    body('confirmation')
        .optional()
        .isIn(['yes', 'true', '1'])
        .withMessage('Operation requires confirmation')
];

module.exports = {
    handleValidationErrors,
    validateRegistration,
    validateLogin,
    validatePasswordReset,
    validateForgotPassword,
    validateChangePassword,
    validateProfileUpdate,
    validateAdminUserUpdate,
    validatePagination,
    validateSearch,
    validateFileUpload,
    validateId,
    validateSensitiveOperation,
    sanitizeInput
};