const expect = require('chai').expect;
const request = require('supertest');
const app = require('../src/app'); // Use app instead of server
const { User } = require('../src/models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');
const { setupTestDatabase, teardownTestDatabase } = require('./setup');

// Increase test timeout to avoid timeouts on CI/CD environments
const TEST_TIMEOUT = 5000;

// Setup test database before all tests
before(async function() {
  this.timeout(10000);
  await setupTestDatabase();
});

// Cleanup after all tests  
after(async function() {
  this.timeout(5000);
  await teardownTestDatabase();
});

describe('Auth API', () => {
  beforeEach(async () => {
    // Force sync the User model to ensure table exists
    await User.sequelize.query('DELETE FROM Users', { raw: true }).catch(() => {
      // If Users table doesn't exist, try User table
      return User.sequelize.query('DELETE FROM User', { raw: true });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).to.equal(201);
      expect(res.body.message).to.equal('Registration successful. Please check your email to verify your account.');
    });

    it('should not register a user with an existing email', async function() {
      this.timeout(TEST_TIMEOUT);
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.errors.field).to.equal('email');
      expect(res.body.errors.message).to.equal('Email already exists.');
    });
    
    it('should not register a user with an existing username', async function() {
      this.timeout(TEST_TIMEOUT);
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test1@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password456',
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.errors.field).to.equal('username');
      expect(res.body.errors.message).to.equal('Username already exists.');
    });
    
    it('should not register a user with invalid input - missing fields', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          // missing password
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Validation failed');
      expect(res.body.details).to.be.an('array');
    });
    
    it('should not register a user with invalid input - short password', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '12345', // too short
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Validation failed');
      expect(res.body.details).to.be.an('array');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a verified user', async function() {
      this.timeout(TEST_TIMEOUT);
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Login successful!');
      expect(res.body.data.token).to.exist;
    });

    it('should not login an unverified user', async function() {
      this.timeout(TEST_TIMEOUT);
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(403);
      expect(res.body.message).to.equal('Please verify your email before logging in.');
    });
    
    it('should not login with invalid credentials - wrong password', async function() {
      this.timeout(TEST_TIMEOUT);
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).to.equal(401);
      expect(res.body.message).to.equal('Invalid email or password.');
    });
    
    it('should not login with invalid credentials - user not found', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(401);
      expect(res.body.message).to.equal('Invalid email or password.');
    });
  });
  
  describe('POST /api/auth/verify-email', () => {
    it('should verify a user with a valid token', async function() {
      this.timeout(TEST_TIMEOUT);
      // Register a user first to generate a verification token
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      
      // Get the verification token from the database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const token = user.verification_token;
      
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Email verified successfully. You can now log in.');
      
      // Check that the user is now verified
      const updatedUser = await User.findOne({ where: { email: 'test@example.com' } });
      expect(updatedUser.is_verified).to.be.true;
      expect(updatedUser.verification_token).to.be.null;
    });
    
    it('should not verify a user with an invalid token', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.errors.message).to.equal('Invalid verification token.');
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should send a reset token to a registered email', async function() {
      this.timeout(TEST_TIMEOUT);
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
      
      // Check that a reset token was generated
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.reset_token).to.exist;
      expect(user.reset_token_expires_at).to.exist;
    });
    
    it('should return success message even for non-existent email (security)', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
    });
  });
  
  describe('POST /api/auth/reset-password', () => {
    it('should reset password with a valid token', async function() {
      this.timeout(TEST_TIMEOUT);
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      
      // Generate a reset token
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const resetToken = 'valid-reset-token';
      const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      
      await user.update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt
      });
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Password has been reset successfully.');
      
      // Check that the reset token was cleared
      const updatedUser = await User.findOne({ where: { email: 'test@example.com' } });
      expect(updatedUser.reset_token).to.be.null;
      expect(updatedUser.reset_token_expires_at).to.be.null;
      
      // Check that we can login with the new password
      await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });
      
      expect(loginRes.statusCode).to.equal(200);
      expect(loginRes.body.message).to.equal('Login successful!');
    });
    
    it('should not reset password with an invalid token', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        });
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.errors.message).to.equal('Invalid or expired password reset token.');
    });
    
    it('should not reset password with a password that is too short', async function() {
      this.timeout(TEST_TIMEOUT);
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      
      // Generate a reset token
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      const resetToken = 'valid-reset-token';
      const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      
      await user.update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt
      });
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '12345' // too short
        });
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Validation failed');
      expect(res.body.details).to.be.an('array');
    });
  });
});

describe('Profile API', () => {
  let token;
  let userId;
  
  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    // Create a verified user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123',
      });
    
    const user = await User.findOne({ where: { email: 'profile@example.com' } });
    user.is_verified = true;
    await user.save();
    userId = user.id;
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'profile@example.com',
        password: 'password123',
      });
    
    token = loginRes.body.data.token;
  });
  
  describe('GET /api/profile', () => {
    it('should get the user profile when authenticated', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.username).to.equal('profileuser');
      expect(res.body.email).to.equal('profile@example.com');
      expect(res.body.id).to.equal(userId);
    });
    
    it('should not get the profile when not authenticated', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/profile');
      
      expect(res.statusCode).to.equal(401);
    });
    
    it('should not get the profile with an invalid token', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.statusCode).to.equal(401);
    });
  });
  
  describe('PUT /api/profile', () => {
    it('should update the user profile when authenticated', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'updateduser',
          email: 'updated@example.com'
        });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.username).to.equal('updateduser');
      expect(res.body.email).to.equal('updated@example.com');
      
      // Check that the database was updated
      const updatedUser = await User.findByPk(userId);
      expect(updatedUser.username).to.equal('updateduser');
      expect(updatedUser.email).to.equal('updated@example.com');
    });
    
    it('should not update the profile when not authenticated', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .put('/api/profile')
        .send({
          username: 'updateduser',
          email: 'updated@example.com'
        });
      
      expect(res.statusCode).to.equal(401);
    });
  });
});

describe('Admin API', () => {
  let adminToken;
  let userToken;
  let regularUserId;
  
  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    // Create an admin user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
      });
    
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    adminUser.is_verified = true;
    adminUser.role = 'admin';
    await adminUser.save();
    
    // Create a regular user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'regularuser',
        email: 'user@example.com',
        password: 'password123',
      });
    
    const regularUser = await User.findOne({ where: { email: 'user@example.com' } });
    regularUser.is_verified = true;
    await regularUser.save();
    regularUserId = regularUser.id;
    
    // Login to get tokens
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });
    
    adminToken = adminLoginRes.body.data.token;
    
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      });
    
    userToken = userLoginRes.body.data.token;
  });
  
  describe('GET /api/admin/users', () => {
    it('should get all users when authenticated as admin', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.data).to.be.an('array');
      expect(res.body.pagination).to.be.an('object');
      expect(res.body.data.length).to.equal(2);
      expect(res.body.data[0].username).to.be.oneOf(['adminuser', 'regularuser']);
      expect(res.body.data[1].username).to.be.oneOf(['adminuser', 'regularuser']);
    });
    
    it('should not get users when authenticated as regular user', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).to.equal(403);
    });
    
    it('should not get users when not authenticated', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .get('/api/admin/users');
      
      expect(res.statusCode).to.equal(401);
    });
  });
  
  describe('PUT /api/admin/users/:id/role', () => {
    it('should update a user role when authenticated as admin', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .put(`/api/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.role).to.equal('admin');
      
      // Check that the database was updated
      const updatedUser = await User.findByPk(regularUserId);
      expect(updatedUser.role).to.equal('admin');
    });
    
    it('should not update a role when authenticated as regular user', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .put(`/api/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });
      
      expect(res.statusCode).to.equal(403);
    });
  });
  
  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user when authenticated as admin', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .delete(`/api/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('User deleted successfully.');
      
      // Check that the user was deleted
      const deletedUser = await User.findByPk(regularUserId);
      expect(deletedUser).to.be.null;
    });
    
    it('should not delete a user when authenticated as regular user', async function() {
      this.timeout(TEST_TIMEOUT);
      const res = await request(app)
        .delete(`/api/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).to.equal(403);
    });
  });
});

describe('Authentication Middleware', () => {
  let token;
  let expiredToken;
  let userId;
  
  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    // Create a verified user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    user.is_verified = true;
    await user.save();
    userId = user.id;
    
    // Create tokens
    token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30m' });
    expiredToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '0s' });
  });
  
  it('should grant access with a valid token', async function() {
    this.timeout(TEST_TIMEOUT);
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).to.equal(200);
  });
  
  it('should deny access with an expired token', async function() {
    this.timeout(TEST_TIMEOUT);
    // Wait a moment to ensure the token is expired
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(res.statusCode).to.equal(401);
  });
  
  it('should deny access with no token', async function() {
    this.timeout(TEST_TIMEOUT);
    const res = await request(app)
      .get('/api/profile');
    
    expect(res.statusCode).to.equal(401);
  });
  
  it('should deny access with an invalid token format', async function() {
    this.timeout(TEST_TIMEOUT);
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token-format');
    
    expect(res.statusCode).to.equal(401);
  });
});

// Global cleanup after all tests
after(async function() {
  await teardownTestDatabase();
  // Force exit if needed
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
