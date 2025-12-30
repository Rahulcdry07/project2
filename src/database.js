const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('./utils/logger');
require('dotenv').config();

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || path.join(__dirname, 'database.sqlite'),
  logging: process.env.DB_LOGGING === 'true',
});

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1); // Exit with error code
  }
})();

// Define the User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Username cannot be empty'
      },
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      notEmpty: {
        msg: 'Email cannot be empty'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password cannot be empty'
      },
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['user', 'admin']],
        msg: 'Role must be either "user" or "admin"'
      }
    }
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
  remember_token: {
    type: DataTypes.STRING,
  },
});

// Add a method to the User model to compare passwords
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Error handling hooks
User.addHook('beforeCreate', async (user, _options) => {
  try {
    // Add any additional validations or data transformations here
    if (user.email) {
      user.email = user.email.toLowerCase(); // Normalize email
    }
  } catch (error) {
    throw new Error(`Error in beforeCreate hook: ${error.message}`);
  }
});

User.addHook('beforeUpdate', async (user, _options) => {
  try {
    // Add any additional validations or data transformations here
    if (user.changed('email')) {
      user.email = user.email.toLowerCase(); // Normalize email
    }
  } catch (error) {
    throw new Error(`Error in beforeUpdate hook: ${error.message}`);
  }
});

module.exports = {
  sequelize,
  User,
};