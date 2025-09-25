const { sequelize } = require('../src/models');

// Track if database is already closed
let databaseClosed = false;

// Test setup and teardown
const setupTestDatabase = async function() {
  console.log('Setting up test database...');
  
  // Force sync all models
  try {
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');
    databaseClosed = false;
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

const teardownTestDatabase = async function() {
  if (databaseClosed) {
    console.log('Database already closed, skipping cleanup');
    return;
  }
  
  console.log('Cleaning up test database...');
  
  try {
    // Close database connection
    await sequelize.close();
    databaseClosed = true;
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    databaseClosed = true;
  }
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase
};