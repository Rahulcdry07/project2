/**
 * Authentication routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

// Logout a user
router.post('/logout', authController.logout);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;