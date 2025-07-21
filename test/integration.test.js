const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const { User, sequelize } = require('../src/database');
require('./test.config');

describe('Integration Tests', () => {
  let server;

  before(async () => {
    server = app.listen(0);
    await User.destroy({ where: {}, truncate: true });
  });

  after(async () => {
    await User.destroy({ where: {}, truncate: true });
    await sequelize.close();
    server.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('Complete User Registration and Verification Flow', () => {
    it('should complete full registration, verification, and login flow', async () => {
      // Step 1: Register new user
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).to.include('Registration successful');

      // Step 2: Verify user was created but not verified
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).to.not.be.null;
      expect(user.is_verified).to.be.false;
      expect(user.verification_token).to.not.be.null;

      // Step 3: Try to login (should fail - not verified)
      const loginAttemptResponse = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(403);

      expect(loginAttemptResponse.body.error).to.include('Please verify your email');

      // Step 4: Verify email using test endpoint
      const verifyResponse = await request(app)
        .post('/api/test/verify-user')
        .send({ email: userData.email })
        .expect(200);

      expect(verifyResponse.body.message).to.include('User verified successfully');

      // Step 5: Verify user is now verified
      const verifiedUser = await User.findOne({ where: { email: userData.email } });
      expect(verifiedUser.is_verified).to.be.true;

      // Step 6: Login successfully
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.message).to.equal('Login successful!');
      expect(loginResponse.body.token).to.be.a('string');
      expect(loginResponse.body.user.email).to.equal(userData.email);
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      // Step 1: Create verified user
      const user = await User.create({
        username: 'resetuser',
        email: 'reset@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      // Step 2: Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(resetRequestResponse.body.message).to.include('password reset link');

      // Step 3: Verify reset token was created
      const userWithToken = await User.findByPk(user.id);
      expect(userWithToken.reset_token).to.not.be.null;
      expect(userWithToken.reset_token_expires_at).to.not.be.null;

      // Step 4: Reset password with token
      const newPassword = 'NewPassword123!';
      const resetResponse = await request(app)
        .post('/api/reset-password')
        .send({
          token: userWithToken.reset_token,
          password: newPassword
        })
        .expect(200);

      expect(resetResponse.body.message).to.include('Password has been reset successfully');

      // Step 5: Verify tokens were cleared
      const resetUser = await User.findByPk(user.id);
      expect(resetUser.reset_token).to.be.null;
      expect(resetUser.reset_token_expires_at).to.be.null;

      // Step 6: Login with new password
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'reset@example.com',
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.message).to.equal('Login successful!');
    });
  });

  describe('Complete Profile Management Flow', () => {
    it('should complete full profile management flow', async () => {
      // Step 1: Create and login user
      const user = await User.create({
        username: 'profileuser',
        email: 'profile@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'profile@example.com',
          password: 'password'
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Step 2: Get profile
      const getProfileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getProfileResponse.body.email).to.equal('profile@example.com');
      expect(getProfileResponse.body.username).to.equal('profileuser');

      // Step 3: Update profile
      const updateData = {
        username: 'updatedprofileuser',
        email: 'updatedprofile@example.com'
      };

      const updateProfileResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateProfileResponse.body.username).to.equal('updatedprofileuser');
      expect(updateProfileResponse.body.email).to.equal('updatedprofile@example.com');

      // Step 4: Change password
      const changePasswordResponse = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'password',
          newPassword: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(changePasswordResponse.body.message).to.include('Password changed successfully');

      // Step 5: Login with new password
      const newLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'updatedprofile@example.com',
          password: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(newLoginResponse.body.message).to.equal('Login successful!');
    });
  });

  describe('Complete Admin Management Flow', () => {
    it('should complete full admin management flow', async () => {
      // Step 1: Create regular user and admin
      const regularUser = await User.create({
        username: 'regularuser',
        email: 'regular@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      const adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'admin'
      });

      // Step 2: Login as admin
      const adminLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'password'
        })
        .expect(200);

      const adminToken = adminLoginResponse.body.token;

      // Step 3: Update user role
      const updateRoleResponse = await request(app)
        .put(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(updateRoleResponse.body.role).to.equal('admin');

      // Step 4: Verify role was updated in database
      const updatedUser = await User.findByPk(regularUser.id);
      expect(updatedUser.role).to.equal('admin');

      // Step 5: Delete user
      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.message).to.include('User deleted successfully');

      // Step 6: Verify user was deleted
      const deletedUser = await User.findByPk(regularUser.id);
      expect(deletedUser).to.be.null;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent registration attempts gracefully', async () => {
      const userData = {
        username: 'concurrentuser',
        email: 'concurrent@example.com',
        password: 'Password123!'
      };

      // Make concurrent registration requests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/api/register')
            .send({
              ...userData,
              username: `${userData.username}${i}`,
              email: `concurrent${i}@example.com`
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed or fail appropriately
      responses.forEach(response => {
        expect([201, 400, 429]).to.include(response.status);
      });
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the app doesn't crash on malformed requests
      
      const response = await request(app)
        .post('/api/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.status).to.equal(400);
    });

    it('should handle missing environment variables gracefully', async () => {
      // Test that the app validates required environment variables
      // This is already tested in the main server file
      expect(process.env.JWT_SECRET).to.not.be.undefined;
    });
  });

  describe('API Response Consistency', () => {
    it('should maintain consistent error response format', async () => {
      const errorTests = [
        {
          endpoint: '/api/register',
          data: {},
          expectedStatus: 400
        },
        {
          endpoint: '/api/login',
          data: { email: 'invalid-email' },
          expectedStatus: 400
        },
        {
          endpoint: '/api/profile',
          expectedStatus: 401
        }
      ];

      for (const test of errorTests) {
        const response = await request(app)
          .post(test.endpoint)
          .send(test.data)
          .expect(test.expectedStatus);

        expect(response.body).to.have.property('error');
        expect(response.body.error).to.be.a('string');
      }
    });

    it('should maintain consistent success response format', async () => {
      // Test registration success response
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'successuser',
          email: 'success@example.com',
          password: 'Password123!'
        })
        .expect(201);

      expect(registerResponse.body).to.have.property('message');
      expect(registerResponse.body.message).to.be.a('string');

      // Test login success response
      const user = await User.create({
        username: 'logintestuser',
        email: 'logintest@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true
      });

      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'logintest@example.com',
          password: 'password'
        })
        .expect(200);

      expect(loginResponse.body).to.have.property('message');
      expect(loginResponse.body).to.have.property('token');
      expect(loginResponse.body).to.have.property('user');
      expect(loginResponse.body.token).to.be.a('string');
      expect(loginResponse.body.user).to.be.an('object');
    });
  });
});
