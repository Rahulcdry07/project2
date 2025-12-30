/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
    logger.info('[AuthMiddleware] authenticate called');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        logger.warn('[AuthMiddleware] No authorization header found');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    logger.debug(`[AuthMiddleware] Authorization header: ${authHeader.substring(0, 20)}...`);
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        logger.warn('[AuthMiddleware] Token not found in authorization header');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            logger.warn(`[AuthMiddleware] Token verification failed: ${err.name}`);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired.' });
            }
            return res.status(401).json({ error: 'Invalid token.' });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role; // Attach user role to request
        
        logger.info(`[AuthMiddleware] Token verified successfully. User ID: ${decoded.userId}, Role: ${decoded.role}`);
        
        next();
    });
}

/**
 * Middleware to check if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = async (req, res, next) => {
    logger.info(`[AuthMiddleware] isAdmin check for user ID: ${req.userId}, Role: ${req.userRole}`);
    
    if (req.userRole === 'admin') {
        logger.debug('[AuthMiddleware] Admin access granted');
        next();
    } else {
        logger.warn('[AuthMiddleware] Admin access denied');
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
};

module.exports = {
    authenticate,
    isAdmin
};