/**
 * Profile routes
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Get user profile
router.get('/', authenticate, profileController.getProfile);

// Update user profile
router.put('/', authenticate, profileController.updateProfile);

module.exports = router;