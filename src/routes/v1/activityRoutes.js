/**
 * Activity routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { getUserActivityLogs } = require('../../controllers/activityController');

// Get user's activity logs
router.get('/', authenticate, getUserActivityLogs);

module.exports = router;
