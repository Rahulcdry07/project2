/**
 * Database configuration and models
 */
const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING } = require('../config/env');
const UserModel = require('./User');
const FileVectorModel = require('./FileVector');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: DB_LOGGING,
});

// Initialize models
const User = UserModel(sequelize);
const FileVector = FileVectorModel(sequelize);

// Set up associations
User.hasMany(FileVector, { foreignKey: 'user_id' });
FileVector.belongsTo(User, { foreignKey: 'user_id' });

// Test the database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

module.exports = {
    sequelize,
    User,
    FileVector,
    testConnection
};
