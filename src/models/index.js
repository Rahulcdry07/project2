/**
 * Database configuration and models
 */
const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING, NODE_ENV } = require('../config/env');
const UserModel = require('./User');
const ActivityLogModel = require('./ActivityLog');
const NotificationModel = require('./Notification');
const NoteModel = require('./Note');
const UserSettingsModel = require('./UserSettings');
const TenderModel = require('./Tender');
const TenderApplicationModel = require('./TenderApplication');
const TenderDocumentModel = require('./TenderDocument');
const ApplicationDocumentModel = require('./ApplicationDocument');
const logger = NODE_ENV !== 'test' ? require('../utils/logger') : { info: () => {}, error: () => {} };

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: DB_LOGGING,
    dialectOptions: {
        // Enable foreign key constraints
        foreignKeys: true
    },
    define: {
        // Ensure foreign keys are properly handled
        underscored: false,
        timestamps: true
    }
});

// Enable foreign keys for SQLite
sequelize.query('PRAGMA foreign_keys = ON');

// Initialize models
const User = UserModel(sequelize);
const ActivityLog = ActivityLogModel(sequelize);
const Notification = NotificationModel(sequelize);
const Note = NoteModel(sequelize);
const UserSettings = UserSettingsModel(sequelize);
const Tender = TenderModel(sequelize);
const TenderApplication = TenderApplicationModel(sequelize);
const TenderDocument = TenderDocumentModel(sequelize);
const ApplicationDocument = ApplicationDocumentModel(sequelize);

// Set up associations
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Note, { foreignKey: 'userId', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(UserSettings, { foreignKey: 'userId', as: 'settings', onDelete: 'CASCADE' });
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Tender associations
const models = {
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

// Call associate function for tender models
/* eslint-disable security/detect-object-injection */
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});
/* eslint-enable security/detect-object-injection */

// Test the database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        return true;
    } catch (error) {
        logger.error('Unable to connect to the database', { error: error.message });
        return false;
    }
};

module.exports = {
    sequelize,
    User,
    ActivityLog,
    Notification,
    Note,
    UserSettings,
    Tender,
    TenderApplication,
    TenderDocument,
    ApplicationDocument,
    testConnection
};