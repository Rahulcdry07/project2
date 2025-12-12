/**
 * Settings routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const {
    getSettings,
    updateSettings,
    changePassword,
    updateEmail
} = require('../../controllers/settingsController');

// Get user settings
router.get('/', authenticate, getSettings);

// Update user settings
router.put('/', authenticate, updateSettings);

// Change password
router.post('/change-password', authenticate, changePassword);

// Update email
router.put('/email', authenticate, updateEmail);

module.exports = router;
