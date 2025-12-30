const logger = require('../utils/logger');

const databaseLogger = (msg) => logger.debug(msg);

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: databaseLogger
  },
  test: {
    dialect: 'sqlite',
    storage: './src/test-database.sqlite',
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: false
  }
};