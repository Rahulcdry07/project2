const { sequelize } = require('../src/models');

// Test setup
before(async function() {
  this.timeout(10000);
  console.log('Setting up test database...');
  
  // Force sync all models
  try {
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
});

// Clean up after tests
after(async function() {
  this.timeout(5000);
  console.log('Cleaning up test database...');
  
  try {
    // Close database connection
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});