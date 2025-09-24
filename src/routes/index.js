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

// Register routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);

module.exports = router;