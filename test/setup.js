const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING } = require('../src/config/env');
const UserModel = require('../src/models/User');

// Create a separate sequelize instance for tests
let testSequelize = null;
let testUser = null;

// Track if database is already closed
let databaseClosed = false;

// Test setup and teardown
const setupTestDatabase = async function() {
  console.log('Setting up test database...');
  
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
    await testSequelize.sync({ force: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

const teardownTestDatabase = async function() {
  if (databaseClosed || !testSequelize) {
    console.log('Database already closed, skipping cleanup');
    return;
  }
  
  console.log('Cleaning up test database...');
  
  try {
    // Close database connection
    await testSequelize.close();
    databaseClosed = true;
    testSequelize = null;
    testUser = null;
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
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
        console.error('Test database connection failed:', error);
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