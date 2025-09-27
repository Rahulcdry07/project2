/**
 * Environment variables and configuration
 */
// Load appropriate .env file based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
    require('dotenv').config({ path: '.env.test' });
} else {
    require('dotenv').config();
}

// Default JWT_SECRET for tests if not set
const JWT_SECRET = process.env.NODE_ENV === 'test' 
    ? (process.env.JWT_SECRET || 'test_jwt_secret_key_for_unit_tests')
    : process.env.JWT_SECRET;

// Default JWT_REFRESH_SECRET for tests if not set
const JWT_REFRESH_SECRET = process.env.NODE_ENV === 'test' 
    ? (process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_for_unit_tests')
    : process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '30m',
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
    DB_STORAGE: process.env.NODE_ENV === 'test' 
        ? 'src/test-database.sqlite'
        : (process.env.DB_STORAGE || 'src/database.sqlite'),
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    NODE_ENV: process.env.NODE_ENV || 'development',
    EMAIL_CONFIG: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    },
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    // File upload configuration
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    MAX_PROFILE_IMAGE_SIZE: parseInt(process.env.MAX_PROFILE_IMAGE_SIZE) || 5242880, // 5MB
    MAX_FILES_PER_USER: parseInt(process.env.MAX_FILES_PER_USER) || 100,
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
    // Security settings
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 300000, // 5 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/app.log'
};
