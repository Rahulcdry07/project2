/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const authService = require('../services/authService');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticate(req, res, next) {
    console.log('[AuthMiddleware] authenticate called');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        console.log('[AuthMiddleware] No authorization header found');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    console.log(`[AuthMiddleware] Authorization header: ${authHeader.substring(0, 20)}...`);
    
    const token = authService.extractTokenFromHeader(authHeader);
    
    if (!token) {
        console.log('[AuthMiddleware] Token not found in authorization header');
        return res.status(401).json({ error: 'No token provided.' });
    }
    
    try {
        const decoded = authService.verifyAccessToken(token);
        
        // Optional: Verify user still exists and is active
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            console.log('[AuthMiddleware] User not found');
            return res.status(401).json({ error: 'User not found.' });
        }
        
        if (!user.is_verified) {
            console.log('[AuthMiddleware] User not verified');
            return res.status(401).json({ error: 'Account not verified.' });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
        req.user = user; // Attach full user object
        
        console.log(`[AuthMiddleware] Token verified successfully. User ID: ${decoded.userId}, Role: ${decoded.role}`);
        
        next();
    } catch (error) {
        console.log(`[AuthMiddleware] Token verification failed: ${error.message}`);
        
        if (error.message.includes('expired')) {
            return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        
        return res.status(401).json({ error: 'Invalid token.' });
    }
}

/**
 * Middleware to check if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = async (req, res, next) => {
    console.log(`[AuthMiddleware] isAdmin check for user ID: ${req.userId}, Role: ${req.userRole}`);
    
    if (req.userRole === 'admin') {
        console.log('[AuthMiddleware] Admin access granted');
        next();
    } else {
        console.log('[AuthMiddleware] Admin access denied');
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
};

module.exports = {
    authenticate,
    isAdmin
};