/**
 * Server entry point
 */
const app = require('./app');
const { sequelize } = require('./models');
const { PORT } = require('./config/env');
const ensureAdminUser = require('./utils/ensureAdminUser');
const logger = require('./utils/logger');

// Sync the database and start the server
sequelize.sync()
  .then(async () => {
    await ensureAdminUser();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    logger.error('Unable to start server:', error);
    process.exit(1);
  });

module.exports = app; // Export for testing