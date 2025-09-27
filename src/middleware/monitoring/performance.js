/**
 * Performance monitoring middleware
 */
const logger = require('../../utils/logger');

/**
 * Performance monitoring middleware
 * Tracks response times and database query performance
 */
const performanceMonitoring = (req, res, next) => {
    const startTime = Date.now();
    const startUsage = process.cpuUsage();
    const startMemory = process.memoryUsage();

    // Track response time
    res.on('finish', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endUsage = process.cpuUsage(startUsage);
        const endMemory = process.memoryUsage();

        // Log performance metrics
        const metrics = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userCpuTime: `${endUsage.user / 1000}ms`,
            systemCpuTime: `${endUsage.system / 1000}ms`,
            memoryDelta: {
                rss: endMemory.rss - startMemory.rss,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal
            },
            timestamp: new Date().toISOString()
        };

        // Log different levels based on performance
        if (responseTime > 2000) {
            logger.warn('Slow response detected', metrics);
        } else if (responseTime > 1000) {
            logger.info('Response time warning', metrics);
        } else {
            logger.debug('Response metrics', metrics);
        }

        // Track memory leaks
        if (endMemory.heapUsed > 100 * 1024 * 1024) { // 100MB
            logger.warn('High memory usage detected', {
                heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(endMemory.heapTotal / 1024 / 1024)}MB`,
                rss: `${Math.round(endMemory.rss / 1024 / 1024)}MB`
            });
        }
    });

    next();
};

/**
 * Database query performance tracker
 */
const trackDatabaseQueries = (sequelize) => {
    let queryCount = 0;
    let totalQueryTime = 0;

    sequelize.addHook('beforeQuery', (options) => {
        options.benchmark = true;
        options.queryStartTime = Date.now();
    });

    sequelize.addHook('afterQuery', (options, query) => {
        const queryTime = Date.now() - options.queryStartTime;
        queryCount++;
        totalQueryTime += queryTime;

        // Log slow queries
        if (queryTime > 500) {
            logger.warn('Slow database query', {
                sql: options.sql,
                queryTime: `${queryTime}ms`,
                bind: options.bind
            });
        }

        // Log query statistics periodically
        if (queryCount % 100 === 0) {
            logger.info('Database query statistics', {
                totalQueries: queryCount,
                averageQueryTime: `${Math.round(totalQueryTime / queryCount)}ms`,
                totalQueryTime: `${totalQueryTime}ms`
            });
        }
    });
};

/**
 * Memory usage monitoring
 */
const memoryMonitoring = () => {
    setInterval(() => {
        const memory = process.memoryUsage();
        const usage = {
            rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memory.external / 1024 / 1024)}MB`,
            arrayBuffers: `${Math.round(memory.arrayBuffers / 1024 / 1024)}MB`
        };

        logger.debug('Memory usage', usage);

        // Alert on high memory usage
        if (memory.heapUsed > 200 * 1024 * 1024) { // 200MB
            logger.warn('High memory usage alert', usage);
        }
    }, 60000); // Check every minute
};

/**
 * Error tracking and analysis
 */
const errorTracking = (error, req, res, next) => {
    const errorDetails = {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
    };

    // Categorize errors
    let errorCategory = 'unknown';
    if (error.name === 'ValidationError') {
        errorCategory = 'validation';
    } else if (error.name === 'SequelizeError') {
        errorCategory = 'database';
    } else if (error.status >= 400 && error.status < 500) {
        errorCategory = 'client';
    } else if (error.status >= 500) {
        errorCategory = 'server';
    }

    logger.error(`${errorCategory.toUpperCase()} ERROR`, errorDetails);

    // Don't expose internal errors to clients
    if (process.env.NODE_ENV === 'production') {
        res.status(error.status || 500).json({
            success: false,
            message: error.status < 500 ? error.message : 'Internal server error'
        });
    } else {
        res.status(error.status || 500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

/**
 * Request/Response logging
 */
const requestLogging = (req, res, next) => {
    const requestData = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    };

    // Don't log sensitive data
    if (req.body && !req.url.includes('/auth/')) {
        requestData.body = req.body;
    }

    logger.info('Incoming request', requestData);
    next();
};

module.exports = {
    performanceMonitoring,
    trackDatabaseQueries,
    memoryMonitoring,
    errorTracking,
    requestLogging
};