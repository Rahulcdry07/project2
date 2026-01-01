/**
 * API v1 Routes
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');
const metricsRoutes = require('./metricsRoutes');
const activityRoutes = require('./activityRoutes');
const notificationRoutes = require('./notificationRoutes');
const notesRoutes = require('./notesRoutes');
const settingsRoutes = require('./settingsRoutes');
const tenderRoutes = require('./tenderRoutes');
const dsrRoutes = require('./dsrRoutes');
const pdfRoutes = require('../pdfRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notes', notesRoutes);
router.use('/settings', settingsRoutes);
router.use('/tenders', tenderRoutes);
router.use('/dsr', dsrRoutes);
router.use('/pdf', pdfRoutes);

module.exports = router;
