/**
 * Database configuration and models
 */
const { Sequelize } = require('sequelize');
const { DB_STORAGE, DB_LOGGING } = require('../config/env');
const UserModel = require('./User');
const TenderModel = require('./Tender');
const TenderApplicationModel = require('./TenderApplication');
const TenderDocumentModel = require('./TenderDocument');
const ApplicationDocumentModel = require('./ApplicationDocument');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: DB_LOGGING,
});

// Initialize models
const User = UserModel(sequelize);
const Tender = TenderModel(sequelize);
const TenderApplication = TenderApplicationModel(sequelize);
const TenderDocument = TenderDocumentModel(sequelize);
const ApplicationDocument = ApplicationDocumentModel(sequelize);

// Set up associations
const models = {
    User,
    Tender,
    TenderApplication,
    TenderDocument,
    ApplicationDocument
};

// Call associate function for each model if it exists
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

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
    Tender,
    TenderApplication,
    TenderDocument,
    ApplicationDocument,
    testConnection
};