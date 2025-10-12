/**
 * Express application setup
 */
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const routes = require('./routes');
const { NODE_ENV } = require('./config/env');
const testRoutes = require('./testRoutes');
const { errorHandler } = require('./utils/apiResponse');
const setupSwagger = require('./swagger');
const logger = require('./utils/logger');
const { metricsMiddleware } = require('./middleware/monitoring/metrics');
const configureSecurityMiddleware = require('./middleware/security');

// Create Express app
const app = express();

// Enable trust proxy to work correctly with rate limiting behind proxies
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));
app.use(metricsMiddleware);

// Apply security middleware
configureSecurityMiddleware(app);

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public/dashboard-app/build')));

// API routes
app.use('/api', routes);

// Only mount test routes in test environment
if (NODE_ENV === 'test') {
    app.use('/api/test', testRoutes);
}

// Setup Swagger documentation
setupSwagger(app);

// Serve React app for all routes that don't start with /api
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard-app/build', 'index.html'));
});

// Global error handler
app.use(errorHandler);

module.exports = app;