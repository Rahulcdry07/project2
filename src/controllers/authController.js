/**
 * Auth controller - Handles authentication related operations
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const { User } = require('../models');
const { JWT_SECRET } = require('../config/env');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { sendSuccess, sendError, sendValidationError } = require('../utils/apiResponse');
const { logActivity } = require('./activityController');
const { createNotification } = require('./notificationController');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
    logger.info('Received registration request', { username: req.body.username, email: req.body.email });
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            logger.warn('Registration validation failed: Missing fields');
            return sendValidationError(res, { message: 'Please fill in all fields.' });
        }

        if (password.length < 6) {
            logger.warn('Registration validation failed: Password too short');
            return sendValidationError(res, { message: 'Password must be at least 6 characters long.' });
        }

        // Check if username or email already exists
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

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            verification_token: verificationToken,
        });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        // Create welcome notification
        await createNotification(
            newUser.id,
            'info',
            'Welcome!',
            `Welcome to our platform, ${username}! We're excited to have you here.`
        );

        return sendSuccess(
            res, 
            null,
            'Registration successful. Please check your email to verify your account.',
            201
        );
    } catch (error) {
        logger.error('Error during registration', { error: error.message, stack: error.stack });
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

        // Create JWT
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30m' });

        // Log login activity
        await logActivity(user.id, 'login', 'User logged in successfully', req);

        return sendSuccess(res, {
            token,
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
exports.logout = (req, res) => {
    return sendSuccess(res, null, 'Logout successful.');
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