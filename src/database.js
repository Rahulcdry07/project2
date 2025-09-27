const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');
// const DatabaseUtils = require('./utils/database');
const logger = require('./utils/logger');
require('dotenv').config();

// Initialize Sequelize with SQLite and optimization settings
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || path.join(__dirname, 'database.sqlite'),
  logging: process.env.DB_LOGGING === 'true' ? (sql, timing) => {
    logger.debug('Database Query', { sql, timing });
  } : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    freezeTableName: true,
    timestamps: true,
    underscored: false
  },
  dialectOptions: {
    // SQLite specific optimizations
    busyTimeout: 30000
  }
});

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
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

// Initialize database utilities
// const dbUtils = new DatabaseUtils(sequelize);

// Add pragma settings for SQLite optimization
sequelize.addHook('afterConnect', async (connection) => {
  try {
    // SQLite performance optimizations
    await connection.query('PRAGMA journal_mode = WAL;');
    await connection.query('PRAGMA synchronous = NORMAL;');
    await connection.query('PRAGMA cache_size = 1000;');
    await connection.query('PRAGMA temp_store = memory;');
    await connection.query('PRAGMA mmap_size = 268435456;'); // 256MB
    logger.info('SQLite optimizations applied');
  } catch (error) {
    logger.error('Error applying SQLite optimizations', { error: error.message });
  }
});

module.exports = {
  sequelize,
  User,
  // dbUtils,
};