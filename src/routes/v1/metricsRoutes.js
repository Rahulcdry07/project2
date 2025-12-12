const express = require('express');
const { metricsEndpoint } = require('../../middleware/monitoring/metrics');

const router = express.Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     description: Returns application metrics in Prometheus format
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics data
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 */
router.get('/', metricsEndpoint);

module.exports = router;