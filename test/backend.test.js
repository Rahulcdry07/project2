const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const { User, sequelize } = require('../src/database');

describe('Backend API Tests', () => {
  let server;
  let testUser;
  let adminUser;
  let testUserToken;
  let adminToken;

  before(async () => {
    // Start the server
    server = app.listen(0); // Use port 0 to get a random available port
    
    // Sync database to create tables
    await sequelize.sync({ force: true });
  });

  after(async () => {
    // Clean up
    await User.destroy({ where: {}, truncate: true });
    await sequelize.close();
    server.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.destroy({ where: {}, truncate: true });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).to.equal('Registration successful. Please check your email to verify your account.');
      
      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).to.not.be.null;
      expect(user.username).to.equal(userData.username);
      expect(user.is_verified).to.be.false;
      expect(user.verification_token).to.not.be.null;
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).to.include('valid email address');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).to.include('Password must be at least 8 characters long');
    });

    it('should reject registration with invalid username', async () => {
      const userData = {
        username: 'te', // Too short
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).to.include('Username must be 3-30 characters long');
    });

    it('should reject registration with existing email', async () => {
      // Create first user
      await User.create({
        username: 'existinguser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: true
      });

      const userData = {
        username: 'newuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).to.equal('Email already exists.');
    });

    it('should reject registration with existing username', async () => {
      // Create first user
      await User.create({
        username: 'testuser',
        email: 'existing@example.com',
        password: 'hashedpassword',
        is_verified: true
      });

      const userData = {
        username: 'testuser',
        email: 'new@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).to.equal('Username already exists.');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a verified test user
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
        is_verified: true,
        role: 'user'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).to.equal('Login successful!');
      expect(response.body.token).to.be.a('string');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal('test@example.com');
      expect(response.body.user.role).to.equal('user');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).to.equal('Invalid email or password.');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).to.equal('Invalid email or password.');
    });

    it('should reject login for unverified user', async () => {
      // Create unverified user
      await User.create({
        username: 'unverified',
        email: 'unverified@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: false,
        role: 'user'
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(403);

      expect(response.body.error).to.equal('Please verify your email before logging in.');
    });

    it('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).to.include('valid email address');
    });
  });

  describe('Email Verification', () => {
    let verificationToken;

    beforeEach(async () => {
      // Create user with verification token
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: false,
        verification_token: 'test-verification-token-123'
      });
      verificationToken = 'test-verification-token-123';
    });

    it('should verify email successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).to.equal('Email verified successfully. You can now log in.');
      
      // Verify user is now verified
      const user = await User.findByPk(testUser.id);
      expect(user.is_verified).to.be.true;
      expect(user.verification_token).to.be.null;
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).to.equal('Invalid verification token.');
    });

    it('should reject verification with missing token', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({})
        .expect(400);

      expect(response.body.error).to.equal('Invalid verification token.');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: true,
        role: 'user'
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
      
      // Verify reset token was created
      const user = await User.findByPk(testUser.id);
      expect(user.reset_token).to.not.be.null;
      expect(user.reset_token_expires_at).to.not.be.null;
    });

    it('should handle password reset request for non-existent user gracefully', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
    });

    it('should reject password reset with invalid email', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).to.include('valid email address');
    });

    it('should reset password successfully with valid token', async () => {
      // Set up reset token
      const resetToken = 'test-reset-token-123';
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      await testUser.update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt
      });

      const newPassword = 'NewPassword123!';
      const response = await request(app)
        .post('/api/reset-password')
        .send({ token: resetToken, password: newPassword })
        .expect(200);

      expect(response.body.message).to.equal('Password has been reset successfully.');
      
      // Verify password was changed and tokens cleared
      const user = await User.findByPk(testUser.id);
      expect(user.reset_token).to.be.null;
      expect(user.reset_token_expires_at).to.be.null;
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.error).to.equal('Invalid or expired password reset token.');
    });

    it('should reject password reset with weak password', async () => {
      const resetToken = 'test-reset-token-123';
      const expiresAt = new Date(Date.now() + 3600000);
      await testUser.update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt
      });

      const response = await request(app)
        .post('/api/reset-password')
        .send({ token: resetToken, password: 'weak' })
        .expect(400);

      expect(response.body.error).to.include('Password must be at least 8 characters long');
    });
  });

  describe('User Profile', () => {
    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: true,
        role: 'user'
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      testUserToken = loginResponse.body.token;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.id).to.equal(testUser.id);
      expect(response.body.username).to.equal('testuser');
      expect(response.body.email).to.equal('test@example.com');
      expect(response.body.role).to.equal('user');
      expect(response.body.is_verified).to.be.true;
      expect(response.body).to.not.have.property('password');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.error).to.equal('No token provided.');
    });

    it('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).to.equal('Invalid token.');
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.username).to.equal('updateduser');
      expect(response.body.email).to.equal('updated@example.com');
      
      // Verify database was updated
      const user = await User.findByPk(testUser.id);
      expect(user.username).to.equal('updateduser');
      expect(user.email).to.equal('updated@example.com');
    });

    it('should change password successfully', async () => {
      const changePasswordData = {
        oldPassword: 'password',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.message).to.equal('Password changed successfully.');
    });

    it('should reject password change with wrong old password', async () => {
      const changePasswordData = {
        oldPassword: 'wrongpassword',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(changePasswordData)
        .expect(401);

      expect(response.body.error).to.equal('Invalid old password.');
    });

    it('should reject password change with same password', async () => {
      const changePasswordData = {
        oldPassword: 'password',
        newPassword: 'password'
      };

      const response = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.error).to.equal('New password must be different from old password.');
    });
  });

  describe('Admin Functions', () => {
    beforeEach(async () => {
      // Create regular user
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: true,
        role: 'user'
      });

      // Create admin user
      adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'admin'
      });

      // Login as admin
      const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'admin@example.com', password: 'password' });
      
      adminToken = loginResponse.body.token;
    });

    it('should update user role successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.role).to.equal('admin');
      
      // Verify database was updated
      const user = await User.findByPk(testUser.id);
      expect(user.role).to.equal('admin');
    });

    it('should reject role update by non-admin user', async () => {
      // Login as regular user
      const userLoginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      const userToken = userLoginResponse.body.token;

      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body.error).to.equal('Forbidden');
    });

    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).to.equal('User deleted successfully.');
      
      // Verify user was deleted
      const user = await User.findByPk(testUser.id);
      expect(user).to.be.null;
    });

    it('should reject user deletion by non-admin user', async () => {
      // Login as regular user
      const userLoginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      const userToken = userLoginResponse.body.token;

      const response = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).to.equal('Forbidden');
    });

    it('should handle deletion of non-existent user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).to.equal('User not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit authentication attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make 6 attempts (limit is 5)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/login')
          .send(loginData)
          .expect(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(429);

      expect(response.body.error).to.include('Too many authentication attempts');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({})
        .expect(400);

      expect(response.body.error).to.be.a('string');
    });
  });

  describe('Test Endpoints', () => {
    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_verified: false,
        verification_token: 'test-token',
        role: 'user'
      });
    });

    it('should verify user via test endpoint', async () => {
      const response = await request(app)
        .post('/api/test/verify-user')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).to.equal('User verified successfully.');
      
      const user = await User.findByPk(testUser.id);
      expect(user.is_verified).to.be.true;
    });

    it('should set user role via test endpoint', async () => {
      const response = await request(app)
        .post('/api/test/set-user-role')
        .send({ email: 'test@example.com', role: 'admin' })
        .expect(200);

      expect(response.body.message).to.equal('User role set to admin successfully.');
      
      const user = await User.findByPk(testUser.id);
      expect(user.role).to.equal('admin');
    });

    it('should get verification token via test endpoint', async () => {
      const response = await request(app)
        .post('/api/test/get-verification-token')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.verificationToken).to.equal('test-token');
    });

    it('should clear database via test endpoint', async () => {
      const response = await request(app)
        .post('/api/test/clear-database')
        .expect(200);

      expect(response.body.message).to.equal('Database cleared successfully.');
      
      const userCount = await User.count();
      expect(userCount).to.equal(0);
    });
  });
});
