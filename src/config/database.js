const logger = require('../utils/logger');

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'project2_dev',
    username: process.env.DB_USER || 'project2_user',
    password: process.env.DB_PASSWORD || 'project2_password',
    logging: msg => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    // Use isolated SQLite file for tests to avoid requiring Postgres locally
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './src/test-database.sqlite',
    logging: false,
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
  },
  // Keep SQLite as backup option
  sqlite: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: msg => logger.debug(msg),
  },
};
