/**
 * Health check route
 */
const express = require('express');
const router = express.Router();
const { testConnection } = require('../../models');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the application and database connection
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-12-07T10:30:00.000Z
 *                 environment:
 *                   type: string
 *                   example: production
 *                 database:
 *                   type: string
 *                   example: connected
 *       500:
 *         description: Application is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: Database connection failed
 */
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