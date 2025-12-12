const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING } = require('../src/config/env');
const UserModel = require('../src/models/User');
const TenderModel = require('../src/models/Tender');
const TenderApplicationModel = require('../src/models/TenderApplication');
const TenderDocumentModel = require('../src/models/TenderDocument');
const ApplicationDocumentModel = require('../src/models/ApplicationDocument');
const ActivityLogModel = require('../src/models/ActivityLog');
const NotificationModel = require('../src/models/Notification');
const NoteModel = require('../src/models/Note');
const UserSettingsModel = require('../src/models/UserSettings');

// Create a separate sequelize instance for tests
let testSequelize = null;
let testModels = null;

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
    
    // Initialize all models
    const User = UserModel(testSequelize);
    const ActivityLog = ActivityLogModel(testSequelize);
    const Notification = NotificationModel(testSequelize);
    const Note = NoteModel(testSequelize);
    const UserSettings = UserSettingsModel(testSequelize);
    const Tender = TenderModel(testSequelize);
    const TenderApplication = TenderApplicationModel(testSequelize);
    const TenderDocument = TenderDocumentModel(testSequelize);
    const ApplicationDocument = ApplicationDocumentModel(testSequelize);

    testModels = {
      User,
      ActivityLog,
      Notification,
      Note,
      UserSettings,
      Tender,
      TenderApplication,
      TenderDocument,
      ApplicationDocument
    };

    // Set up associations
    Object.keys(testModels).forEach(modelName => {
      if (testModels[modelName].associate) {
        testModels[modelName].associate(testModels);
      }
    });

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
    testModels = null;
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    databaseClosed = true;
    testSequelize = null;
    testModels = null;
  }
};

// Export test models for use in tests
const getTestModels = () => {
  if (!testModels) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }
  return {
    ...testModels,
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