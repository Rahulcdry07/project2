/**
 * API routes index
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');
const metricsRoutes = require('./metricsRoutes');
const fileRoutes = require('./fileRoutes');

// Register routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);
router.use('/files', fileRoutes);

module.exports = router;