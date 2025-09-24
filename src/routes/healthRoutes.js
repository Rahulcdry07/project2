/**
 * Health check route
 */
const express = require('express');
const router = express.Router();
const { testConnection } = require('../models');

router.get('/', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbConnected ? 'connected' : 'disconnected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: error.message
        });
    }
});

module.exports = router;