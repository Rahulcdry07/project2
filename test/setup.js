const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING } = require('../src/config/env');
const UserModel = require('../src/models/User');
const logger = require('../src/utils/logger');

// Create a separate sequelize instance for tests
let testSequelize = null;
let testUser = null;

// Track if database is already closed
let databaseClosed = false;

// Test setup and teardown
const setupTestDatabase = async function() {
  logger.info('Setting up test database...');
  
  // Create new sequelize instance if needed
  if (!testSequelize || databaseClosed) {
    testSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DB_STORAGE || 'src/test-database.sqlite',
      logging: DB_LOGGING,
    });
    
    // Initialize models
    testUser = UserModel(testSequelize);
    databaseClosed = false;
  }
  
  try {
    await testSequelize.query('PRAGMA foreign_keys = OFF;');
    await testSequelize.sync({ force: true });
    await testSequelize.query('PRAGMA foreign_keys = ON;');
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Error syncing database:', error);
    throw error;
  }
};

const teardownTestDatabase = async function() {
  if (databaseClosed || !testSequelize) {
    logger.debug('Database already closed, skipping cleanup');
    return;
  }
  
  logger.info('Cleaning up test database...');
  
  try {
    // Close database connection
    await testSequelize.close();
    databaseClosed = true;
    testSequelize = null;
    testUser = null;
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    databaseClosed = true;
    testSequelize = null;
    testUser = null;
  }
};

// Export test models for use in tests
const getTestModels = () => {
  if (!testUser) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }
  return {
    User: testUser,
    sequelize: testSequelize,
    testConnection: async () => {
      try {
        await testSequelize.authenticate();
        return true;
      } catch (error) {
        logger.error('Test database connection failed:', error);
        return false;
      }
    }
  };
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  getTestModels
};