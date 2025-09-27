/**
 * Server entry point
 */
const app = require('./app');
const { sequelize } = require('./models');
const { PORT } = require('./config/env');
const { trackDatabaseQueries, memoryMonitoring } = require('./middleware/monitoring/performance');
const logger = require('./utils/logger');

// Initialize performance monitoring
trackDatabaseQueries(sequelize);
memoryMonitoring();

// Sync the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        memory: process.memoryUsage()
      });
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    logger.error('Unable to start server', { error: error.message, stack: error.stack });
    console.error('Unable to start server:', error);
    process.exit(1);
  });

module.exports = app; // Export for testing