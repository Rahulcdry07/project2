/**
 * Server entry point
 */
const app = require('./app');
const { sequelize } = require('./models');
const { PORT } = require('./config/env');

// Sync the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to start server:', error);
    process.exit(1);
  });

module.exports = app; // Export for testing