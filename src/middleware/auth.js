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
    logger.debug('authenticate middleware called');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        logger.warn('Authentication failed: No authorization header');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    logger.debug('Authorization header present', { headerPrefix: authHeader.substring(0, 20) });
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        logger.warn('Authentication failed: Token not found in header');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            logger.warn('Token verification failed', { errorName: err.name });
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired.' });
            }
            return res.status(401).json({ error: 'Invalid token.' });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role; // Attach user role to request
        
        logger.debug('Token verified successfully', { userId: decoded.userId, role: decoded.role });
        
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
    logger.debug('isAdmin check', { userId: req.userId, role: req.userRole });
    
    if (req.userRole === 'admin') {
        logger.debug('Admin access granted', { userId: req.userId });
        next();
    } else {
        logger.warn('Admin access denied', { userId: req.userId, role: req.userRole });
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
};

module.exports = {
    authenticate,
    isAdmin
};