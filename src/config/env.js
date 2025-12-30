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

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET,
    DB_STORAGE: process.env.NODE_ENV === 'test' 
        ? 'src/test-database.sqlite'
        : (process.env.DB_STORAGE || 'src/database.sqlite'),
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    RESET_ADMIN_PASSWORD: process.env.RESET_ADMIN_PASSWORD === 'true',
    EMAIL_CONFIG: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    },
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
};