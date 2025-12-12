const logger = require('../utils/logger');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: (msg) => logger.debug(msg)
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