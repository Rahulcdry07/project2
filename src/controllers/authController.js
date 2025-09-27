/**
 * Auth controller - Handles authentication related operations
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { User } = require('../models');
// const { dbUtils } = require('../database');
const { JWT_SECRET } = require('../config/env');
const authService = require('../services/authService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { sendSuccess, sendError, sendValidationError } = require('../utils/apiResponse');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
    console.log('Received registration request with body:', req.body);
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            console.log('Validation failed: Missing fields');
            return sendValidationError(res, { message: 'Please fill in all fields.' });
        }

        if (password.length < 6) {
            console.log('Validation failed: Password too short');
            return sendValidationError(res, { message: 'Password must be at least 6 characters long.' });
        }

                // Check if user already exists
        const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
        if (existingUser) {
            if (existingUser.username === username) {
                return sendValidationError(res, { field: 'username', message: 'Username already exists.' });
            }
            if (existingUser.email === email) {
                return sendValidationError(res, { field: 'email', message: 'Email already exists.' });
            }
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            verification_token: verificationToken,
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        return sendSuccess(
            res, 
            null,
            'Registration successful. Please check your email to verify your account.',
            201
        );
    } catch (error) {
        console.error('Error during registration:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return sendError(res, 'Invalid email or password.', 401);
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return sendError(res, 'Invalid email or password.', 401);
        }
        
        if (!user.is_verified) {
            return sendError(res, 'Please verify your email before logging in.', 403);
        }

        // Generate tokens using auth service
        const tokens = await authService.generateTokens(user);

        return sendSuccess(res, {
            ...tokens,
            token: tokens.accessToken, // Add this for compatibility
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            redirect: '/dashboard.html'
        }, 'Login successful!');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
    try {
        // Revoke refresh token if user is authenticated
        if (req.userId) {
            await authService.revokeRefreshToken(req.userId);
        }
        return sendSuccess(res, null, 'Logout successful.');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Verify user's email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({ where: { verification_token: token } });
        
        if (!user) {
            return sendValidationError(res, { message: 'Invalid verification token.' });
        }
        
        user.is_verified = true;
        user.verification_token = null;
        await user.save();
        
        return sendSuccess(res, null, 'Email verified successfully. You can now log in.');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Send password reset link
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.reset_token = resetToken;
            user.reset_token_expires_at = new Date(Date.now() + 3600000); // 1 hour from now
            await user.save();
            
            // Send password reset email
            await sendPasswordResetEmail(email, resetToken);
        }
        
        // Always return the same message for security
        return sendSuccess(
            res, 
            null, 
            'If your email address is in our database, you will receive a password reset link.'
        );
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Reset user's password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ 
            where: { 
                reset_token: token, 
                reset_token_expires_at: { [Op.gt]: new Date() } 
            } 
        });
        
        if (!user) {
            return sendValidationError(res, { message: 'Invalid or expired password reset token.' });
        }
        
        if (password.length < 6) {
            return sendValidationError(res, { message: 'Password must be at least 6 characters long.' });
        }
        
        user.password = await bcrypt.hash(password, 10);
        user.reset_token = null;
        user.reset_token_expires_at = null;
        await user.save();
        
        return sendSuccess(res, null, 'Password has been reset successfully.');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return sendValidationError(res, { message: 'Refresh token is required.' });
        }

        const tokens = await authService.refreshAccessToken(refreshToken);
        
        return sendSuccess(res, tokens, 'Tokens refreshed successfully.');
    } catch (error) {
        return sendError(res, error.message, 401);
    }
};

/**
 * Revoke refresh token (logout from all devices)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeToken = async (req, res) => {
    try {
        await authService.revokeAllRefreshTokens(req.userId);
        return sendSuccess(res, null, 'All sessions revoked successfully.');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return sendValidationError(res, { message: 'Both old and new passwords are required.' });
        }
        
        if (newPassword.length < 6) {
            return sendValidationError(res, { message: 'New password must be at least 6 characters long.' });
        }
        
        const user = await User.findByPk(req.userId);
        if (!user) {
            return sendError(res, 'User not found.', 404);
        }
        
        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return sendValidationError(res, { message: 'Current password is incorrect.' });
        }
        
        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        // Revoke all refresh tokens to force re-login on all devices
        await authService.revokeAllRefreshTokens(user.id);
        
        return sendSuccess(res, null, 'Password changed successfully. Please log in again.');
    } catch (error) {
        return sendError(res, error.message);
    }
};
