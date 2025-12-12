/**
 * Server entry point
 */
const validateEnv = require('./config/validateEnv');
const app = require('./app');
const { sequelize } = require('./models');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

// Validate environment variables
validateEnv();

// Sync the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    logger.error('Unable to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  });

module.exports = app; // Export for testing