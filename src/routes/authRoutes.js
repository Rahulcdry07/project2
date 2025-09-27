/**
 * Authentication routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiting');

// Register a new user
router.post('/register', authLimiter, authController.register);

// Login a user
router.post('/login', authLimiter, authController.login);

// Logout a user
router.post('/logout', authController.logout);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Forgot password
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

// Reset password
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// Refresh access token
router.post('/refresh', authLimiter, authController.refreshToken);

// Revoke all tokens (logout from all devices)
router.post('/revoke', authenticate, authController.revokeToken);

// Change password
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
