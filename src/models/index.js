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
const logger = NODE_ENV !== 'test' ? require('../utils/logger') : { info: () => {}, error: () => {} };

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: DB_LOGGING,
});

// Initialize models
const User = UserModel(sequelize);
const ActivityLog = ActivityLogModel(sequelize);
const Notification = NotificationModel(sequelize);
const Note = NoteModel(sequelize);
const UserSettings = UserSettingsModel(sequelize);

// Set up associations
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(UserSettings, { foreignKey: 'userId', as: 'settings' });
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
    testConnection
};