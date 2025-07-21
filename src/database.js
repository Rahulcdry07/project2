const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

// Initialize Sequelize with SQLite - Environment-based configuration
const getDatabasePath = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      return path.join(__dirname, 'test-database.sqlite');
    case 'production':
      return path.join(__dirname, 'production-database.sqlite');
    default:
      return path.join(__dirname, 'database.sqlite');
  }
};

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: getDatabasePath(),
  logging: process.env.NODE_ENV === 'development',
});

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user', // 'user' or 'admin'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_token: {
    type: DataTypes.STRING,
  },
  reset_token: {
    type: DataTypes.STRING,
  },
  reset_token_expires_at: {
    type: DataTypes.DATE,
  },
  refresh_token: {
    type: DataTypes.STRING,
  },
  refresh_token_expires_at: {
    type: DataTypes.DATE,
  },
  // Enhanced profile fields
  profile_picture: {
    type: DataTypes.STRING, // URL to stored image
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  github_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  linkedin_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  twitter_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profile_privacy: {
    type: DataTypes.ENUM('public', 'private', 'friends'),
    defaultValue: 'public',
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  profile_completion: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // Percentage (0-100)
  },
}, {
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['verification_token']
    },
    {
      fields: ['reset_token']
    },
    {
      fields: ['refresh_token']
    }
  ]
});

module.exports = {
  sequelize,
  User,
};