// Test configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'test';
process.env.SMTP_PASS = 'test';

// Increase timeout for tests
process.env.MOCHA_TIMEOUT = '10000';

module.exports = {
  // Test database configuration
  database: {
    dialect: 'sqlite',
    storage: ':memory:', // Use in-memory database for tests
    logging: false
  },
  
  // Test user credentials
  testUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  },
  
  // Test admin credentials
  testAdmin: {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'Password123!',
    role: 'admin'
  },
  
  // Test timeouts
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000
  }
}; 