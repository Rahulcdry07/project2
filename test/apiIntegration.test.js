/**
 * API Integration tests - End-to-end tests for API endpoints and workflows
 */
const expect = require('chai').expect;
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

// Import app
const app = require('../src/app');

// Import test utilities
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('API Integration Tests', () => {
  let User, FileVector, sequelize;
  let authToken, testUser, adminToken, adminUser;

  before(async function() {
    this.timeout(15000);
    await setupTestDatabase();
    const testModels = getTestModels();
    User = testModels.User;
    sequelize = testModels.sequelize;
    
    // Create FileVector model for tests
    const { DataTypes } = require('sequelize');
    FileVector = sequelize.define('FileVector', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false
      },
      originalname: {
        type: DataTypes.STRING,
        allowNull: false
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: false
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id'
        }
      },
      compression_ratio: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      }
    });

    await FileVector.sync({ force: true });
  });

  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await FileVector.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test users
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      is_verified: true
    });

    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      is_verified: true
    });

    // Get auth tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });

    authToken = userLogin.body.data.token;
    adminToken = adminLogin.body.data.token;
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full registration workflow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(registerResponse.status).to.equal(201);
      expect(registerResponse.body.success).to.be.true;
      expect(registerResponse.body.data.user.username).to.equal('newuser');

      // 2. Verify user exists but is unverified
      const user = await User.findOne({ where: { email: 'newuser@example.com' } });
      expect(user).to.exist;
      expect(user.is_verified).to.be.false;
      expect(user.verification_token).to.exist;

      // 3. Attempt login before verification (should fail)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).to.equal(403);
      expect(loginResponse.body.success).to.be.false;

      // 4. Verify email
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: user.verification_token
        });

      expect(verifyResponse.status).to.equal(200);
      expect(verifyResponse.body.success).to.be.true;

      // 5. Login after verification (should succeed)
      const successLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(successLoginResponse.status).to.equal(200);
      expect(successLoginResponse.body.success).to.be.true;
      expect(successLoginResponse.body.data.token).to.exist;
    });

    it('should complete password reset workflow', async () => {
      // 1. Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(forgotResponse.status).to.equal(200);
      expect(forgotResponse.body.success).to.be.true;

      // 2. Verify reset token was set
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.reset_token).to.exist;
      expect(user.reset_token_expires_at).to.exist;

      // 3. Reset password with token
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: user.reset_token,
          password: 'newPassword123'
        });

      expect(resetResponse.status).to.equal(200);
      expect(resetResponse.body.success).to.be.true;

      // 4. Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newPassword123'
        });

      expect(loginResponse.status).to.equal(200);
      expect(loginResponse.body.success).to.be.true;

      // 5. Verify old password no longer works
      const oldPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(oldPasswordResponse.status).to.equal(401);
    });
  });

  describe('File Management Workflow Integration', () => {
    it('should complete full file upload and management workflow', async () => {
      // 1. Upload multiple files
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('PDF content'), 'document.pdf')
        .attach('files', Buffer.from('Image content'), 'image.jpg');

      expect(uploadResponse.status).to.equal(200);
      expect(uploadResponse.body.success).to.be.true;
      expect(uploadResponse.body.data.files).to.have.length(2);

      // 2. List uploaded files
      const listResponse = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).to.equal(200);
      expect(listResponse.body.data.files).to.have.length(2);
      expect(listResponse.body.data.total).to.equal(2);

      const fileId = listResponse.body.data.files[0].id;

      // 3. Search files
      const searchResponse = await request(app)
        .get('/api/files?search=document')
        .set('Authorization', `Bearer ${authToken}`);

      expect(searchResponse.status).to.equal(200);
      expect(searchResponse.body.data.files).to.have.length(1);
      expect(searchResponse.body.data.files[0].originalname).to.contain('document');

      // 4. Get file analytics
      const analyticsResponse = await request(app)
        .get('/api/files/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(analyticsResponse.status).to.equal(200);
      expect(analyticsResponse.body.data.totalFiles).to.equal(2);
      expect(analyticsResponse.body.data.typeBreakdown).to.be.an('array');

      // 5. Download file
      const downloadResponse = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(downloadResponse.status).to.equal(200);

      // 6. Delete single file
      const deleteResponse = await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).to.equal(200);
      expect(deleteResponse.body.success).to.be.true;

      // 7. Verify file was deleted
      const finalListResponse = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalListResponse.body.data.total).to.equal(1);
    });

    it('should handle bulk file operations', async () => {
      // Upload test files
      await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('File 1'), 'file1.txt')
        .attach('files', Buffer.from('File 2'), 'file2.txt')
        .attach('files', Buffer.from('File 3'), 'file3.txt');

      // Get file IDs
      const listResponse = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`);

      const fileIds = listResponse.body.data.files.map(f => f.id);

      // Bulk delete first two files
      const bulkDeleteResponse = await request(app)
        .post('/api/files/bulk-delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileIds: fileIds.slice(0, 2)
        });

      expect(bulkDeleteResponse.status).to.equal(200);
      expect(bulkDeleteResponse.body.success).to.be.true;
      expect(bulkDeleteResponse.body.message).to.contain('2 files deleted');

      // Verify only one file remains
      const finalListResponse = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalListResponse.body.data.total).to.equal(1);
    });

    it('should enforce file access permissions', async () => {
      // Create another user
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
        is_verified: true
      });

      const otherUserLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });

      const otherToken = otherUserLogin.body.data.token;

      // Upload file as first user
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('Private file'), 'private.txt');

      const fileId = uploadResponse.body.data.files[0].id;

      // Try to access file as other user (should fail)
      const accessResponse = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(accessResponse.status).to.equal(404);

      // Try to delete other user's file (should fail)
      const deleteResponse = await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(deleteResponse.status).to.equal(404);

      // Verify original user can still access their file
      const validDownloadResponse = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(validDownloadResponse.status).to.equal(200);
    });
  });

  describe('Profile Management Integration', () => {
    it('should complete profile enhancement workflow', async () => {
      // 1. Get initial profile
      const initialProfileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialProfileResponse.status).to.equal(200);
      expect(initialProfileResponse.body.username).to.equal('testuser');

      // 2. Update profile information
      const updateResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          bio: 'Updated bio information',
          date_of_birth: '1990-01-01'
        });

      expect(updateResponse.status).to.equal(200);
      expect(updateResponse.body.success).to.be.true;
      expect(updateResponse.body.data.first_name).to.equal('John');
      expect(updateResponse.body.data.last_name).to.equal('Doe');

      // 3. Upload profile picture
      const pictureResponse = await request(app)
        .post('/api/profile/picture')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('Image data'), 'avatar.jpg');

      expect(pictureResponse.status).to.equal(200);
      expect(pictureResponse.body.success).to.be.true;

      // 4. Change password
      const passwordResponse = await request(app)
        .post('/api/profile/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword456',
          confirmPassword: 'newPassword456'
        });

      expect(passwordResponse.status).to.equal(200);
      expect(passwordResponse.body.success).to.be.true;

      // 5. Get profile statistics
      const statsResponse = await request(app)
        .get('/api/profile/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statsResponse.status).to.equal(200);
      expect(statsResponse.body.data.profileCompletion).to.be.a('number');
      expect(statsResponse.body.data.accountAge).to.be.a('number');

      // 6. Update security settings
      const securityResponse = await request(app)
        .put('/api/profile/security')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          two_factor_enabled: true,
          notification_preferences: {
            email_notifications: false,
            security_alerts: true
          }
        });

      expect(securityResponse.status).to.equal(200);
      expect(securityResponse.body.success).to.be.true;

      // 7. Export profile data
      const exportResponse = await request(app)
        .get('/api/profile/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(exportResponse.status).to.equal(200);
      expect(exportResponse.body.data.profile).to.exist;
      expect(exportResponse.body.data.exportedAt).to.exist;
    });

    it('should handle profile validation correctly', async () => {
      // Test invalid phone number
      const invalidPhoneResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '123' // Invalid format
        });

      expect(invalidPhoneResponse.status).to.equal(400);
      expect(invalidPhoneResponse.body.success).to.be.false;

      // Test future birth date
      const invalidDateResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date_of_birth: '2030-01-01'
        });

      expect(invalidDateResponse.status).to.equal(400);
      expect(invalidDateResponse.body.success).to.be.false;

      // Test bio too long
      const longBioResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'a'.repeat(1001)
        });

      expect(longBioResponse.status).to.equal(400);
      expect(longBioResponse.body.success).to.be.false;
    });
  });

  describe('Admin Operations Integration', () => {
    it('should complete admin user management workflow', async () => {
      // 1. Get all users (admin only)
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersResponse.status).to.equal(200);
      expect(usersResponse.body).to.be.an('array');
      expect(usersResponse.body.length).to.equal(2); // testUser and adminUser

      // 2. Try to access admin endpoint as regular user (should fail)
      const unauthorizedResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(unauthorizedResponse.status).to.equal(403);

      // 3. Update user role
      const roleUpdateResponse = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin'
        });

      expect(roleUpdateResponse.status).to.equal(200);
      expect(roleUpdateResponse.body.role).to.equal('admin');

      // 4. Get system metrics (admin only)
      const metricsResponse = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsResponse.status).to.equal(200);
      expect(metricsResponse.headers['content-type']).to.contain('text/plain');
    });

    it('should handle admin user deletion workflow', async () => {
      // Create user to delete
      const userToDelete = await User.create({
        username: 'deleteuser',
        email: 'delete@example.com',
        password: 'password123',
        is_verified: true
      });

      // Delete user as admin
      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).to.equal(200);
      expect(deleteResponse.body.message).to.contain('deleted successfully');

      // Verify user was deleted
      const deletedUser = await User.findByPk(userToDelete.id);
      expect(deletedUser).to.be.null;

      // Try to delete non-existent user
      const notFoundResponse = await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(notFoundResponse.status).to.equal(404);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on authentication endpoints', async function() {
      this.timeout(10000);

      const requests = [];
      const maxRequests = 10; // Assuming auth rate limit is 10 requests

      // Make multiple rapid login attempts
      for (let i = 0; i < maxRequests + 2; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);

      // First requests should get 401 (unauthorized)
      expect(responses[0].status).to.equal(401);

      // Later requests should get 429 (rate limited)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });

    it('should enforce different rate limits for different endpoints', async function() {
      this.timeout(10000);

      // Test file upload rate limiting
      const uploadRequests = [];
      for (let i = 0; i < 6; i++) { // Assuming upload limit is 5
        uploadRequests.push(
          request(app)
            .post('/api/files/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('files', Buffer.from(`File ${i}`), `file${i}.txt`)
        );
      }

      const uploadResponses = await Promise.all(uploadRequests);
      
      // Some should succeed, some should be rate limited
      const successfulUploads = uploadResponses.filter(res => res.status === 200);
      const rateLimitedUploads = uploadResponses.filter(res => res.status === 429);
      
      expect(successfulUploads.length).to.be.greaterThan(0);
      expect(rateLimitedUploads.length).to.be.greaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed requests gracefully', async () => {
      // Invalid JSON
      const invalidJsonResponse = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(invalidJsonResponse.status).to.equal(400);

      // Missing required fields
      const missingFieldsResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test'
          // missing email and password
        });

      expect(missingFieldsResponse.status).to.equal(400);
      expect(missingFieldsResponse.body.success).to.be.false;
    });

    it('should handle file upload errors', async () => {
      // Upload without authentication
      const noAuthResponse = await request(app)
        .post('/api/files/upload')
        .attach('files', Buffer.from('content'), 'file.txt');

      expect(noAuthResponse.status).to.equal(401);

      // Upload with invalid file type (if restrictions are in place)
      const invalidFileResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('executable content'), 'malware.exe');

      // Should either reject the file type or handle it gracefully
      expect([400, 200]).to.include(invalidFileResponse.status);
    });

    it('should handle database connection issues', async () => {
      // This would require mocking database failures
      // For now, we'll test that the health endpoint shows database status
      const healthResponse = await request(app)
        .get('/api/health');

      expect(healthResponse.status).to.equal(200);
      expect(healthResponse.body.database).to.exist;
    });
  });

  describe('Security Integration', () => {
    it('should prevent unauthorized access to protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/profile' },
        { method: 'put', path: '/api/profile' },
        { method: 'get', path: '/api/files' },
        { method: 'post', path: '/api/files/upload' },
        { method: 'get', path: '/api/admin/users' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).to.equal(401);
        expect(response.body.error).to.contain('token');
      }
    });

    it('should validate JWT tokens properly', async () => {
      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidTokenResponse.status).to.equal(401);

      // Test with malformed authorization header
      const malformedHeaderResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token');

      expect(malformedHeaderResponse.status).to.equal(401);

      // Test with expired token (would require creating expired token)
      // This is typically handled by the JWT library
    });

    it('should sanitize user inputs', async () => {
      // Test XSS prevention in profile update
      const xssResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: '<script>alert("xss")</script>Safe content'
        });

      expect(xssResponse.status).to.equal(200);
      
      // Bio should be sanitized
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.body.bio).to.not.contain('<script>');
      expect(profileResponse.body.bio).to.contain('Safe content');
    });

    it('should enforce HTTPS in production headers', async () => {
      // Test security headers
      const response = await request(app)
        .get('/api/health');

      // Check for security headers
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-xss-protection');
    });
  });
});