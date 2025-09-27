/**
 * Enhanced security middleware with rate limiting
 */
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/env');

// Check if we're in test mode AND if we're testing middleware specifically
const isTestMode = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TESTING === 'true';
const isTestingMiddleware = process.env.TESTING_MIDDLEWARE === 'true' || 
                          (typeof global !== 'undefined' && global.TESTING_MIDDLEWARE);

// Create a no-op middleware for general test mode (not middleware testing)
const noOpMiddleware = (req, res, next) => next();

// General rate limiting
const generalLimiter = (isTestMode && !isTestingMiddleware) ? noOpMiddleware : rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: RATE_LIMIT_MAX_REQUESTS, // 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = (isTestMode && !isTestingMiddleware) ? noOpMiddleware : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// File upload rate limiting
const uploadLimiter = (isTestMode && !isTestingMiddleware) ? noOpMiddleware : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset rate limiting
const passwordResetLimiter = (isTestMode && !isTestingMiddleware) ? noOpMiddleware : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Create a custom rate limiter with provided options
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
function createRateLimit(options = {}) {
    if (isTestMode && !isTestingMiddleware) {
        return noOpMiddleware;
    }
    
    const defaultOptions = {
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX_REQUESTS,
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    };
    
    return rateLimit({ ...defaultOptions, ...options });
}

// Alias for general limiter
const apiLimiter = generalLimiter;

module.exports = {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    passwordResetLimiter,
    createRateLimit,
    apiLimiter
};