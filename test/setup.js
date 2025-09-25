const { sequelize } = require('../src/models');

// Test setup and teardown
const setupTestDatabase = async function() {
  console.log('Setting up test database...');
  
  // Force sync all models
  try {
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

const teardownTestDatabase = async function() {
  console.log('Cleaning up test database...');
  
  try {
    // Close database connection
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase
};