/**
 * Authentication service with JWT and refresh tokens
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION } = require('../config/env');

class AuthService {
    /**
     * Generate access token
     * @param {Object} payload - Token payload
     * @returns {string} JWT access token
     */
    generateAccessToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRATION,
            issuer: 'dynamic-web-app',
            audience: 'dynamic-web-app-users'
        });
    }

    /**
     * Generate refresh token
     * @param {Object} payload - Token payload
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, JWT_REFRESH_SECRET, { 
            expiresIn: JWT_REFRESH_EXPIRATION,
            issuer: 'dynamic-web-app',
            audience: 'dynamic-web-app-users'
        });
    }

    /**
     * Generate both access and refresh tokens
     * @param {Object} user - User object
     * @returns {Object} Token pair
     */
    async generateTokens(user) {
        const payload = {
            userId: user.id,
            role: user.role,
            email: user.email,
            isVerified: user.is_verified
        };

        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        // Store refresh token in database with expiry
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setTime(refreshTokenExpiry.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

        await user.update({
            refresh_token: refreshToken,
            refresh_token_expires_at: refreshTokenExpiry
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRATION,
            tokenType: 'Bearer'
        };
    }

    /**
     * Verify access token
     * @param {string} token - JWT access token
     * @returns {Object} Decoded token payload
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET, {
                issuer: 'dynamic-web-app',
                audience: 'dynamic-web-app-users'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token');
            } else {
                throw new Error('Token verification failed');
            }
        }
    }

    /**
     * Verify refresh token
     * @param {string} token - JWT refresh token
     * @returns {Object} Decoded token payload
     */
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET, {
                issuer: 'dynamic-web-app',
                audience: 'dynamic-web-app-users'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            } else {
                throw new Error('Refresh token verification failed');
            }
        }
    }

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - JWT refresh token
     * @returns {Object} New token pair
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = this.verifyRefreshToken(refreshToken);
            
            // Find user and validate refresh token
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if refresh token matches and hasn't expired
            if (user.refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            if (new Date() > user.refresh_token_expires_at) {
                throw new Error('Refresh token expired');
            }

            // Generate new token pair
            return await this.generateTokens(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Revoke refresh token
     * @param {number} userId - User ID
     * @returns {boolean} Success status
     */
    async revokeRefreshToken(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.update({
                refresh_token: null,
                refresh_token_expires_at: null
            });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     * @param {number} userId - User ID
     * @returns {boolean} Success status
     */
    async revokeAllRefreshTokens(userId) {
        return await this.revokeRefreshToken(userId);
    }

    /**
     * Generate secure random token for password reset, email verification, etc.
     * @param {number} length - Token length
     * @returns {string} Random token
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash password reset token
     * @param {string} token - Plain token
     * @returns {string} Hashed token
     */
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Verify password reset token
     * @param {string} plainToken - Plain token
     * @param {string} hashedToken - Hashed token
     * @returns {boolean} Verification result
     */
    verifyToken(plainToken, hashedToken) {
        const hashedPlainToken = this.hashToken(plainToken);
        return hashedPlainToken === hashedToken;
    }

    /**
     * Extract token from authorization header
     * @param {string} authHeader - Authorization header
     * @returns {string|null} Token or null
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        
        return parts[1];
    }

    /**
     * Check if user account is locked
     * @param {Object} user - User object
     * @returns {boolean} Lock status
     */
    isAccountLocked(user) {
        // This could be extended with account locking logic
        return false;
    }

    /**
     * Get token expiry time
     * @param {string} token - JWT token
     * @returns {Date} Expiry date
     */
    getTokenExpiry(token) {
        try {
            const decoded = jwt.decode(token);
            return new Date(decoded.exp * 1000);
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if token is about to expire (within 5 minutes)
     * @param {string} token - JWT token
     * @returns {boolean} Near expiry status
     */
    isTokenNearExpiry(token) {
        const expiry = this.getTokenExpiry(token);
        if (!expiry) return true;
        
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        return expiry <= fiveMinutesFromNow;
    }
}

module.exports = new AuthService();