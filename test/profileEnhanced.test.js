/**
 * Enhanced Profile Controller tests - Unit tests for enhanced profile functionality
 */
const expect = require('chai').expect;
const sinon = require('sinon');
const bcrypt = require('bcrypt');

// Import enhanced profile controller
const profileController = require('../src/controllers/profileController');

// Import utilities
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('Enhanced Profile Controller', () => {
  let User, sequelize;
  let testUser, req, res;

  before(async function() {
    this.timeout(10000);
    await setupTestDatabase();
    const testModels = getTestModels();
    User = testModels.User;
    sequelize = testModels.sequelize;
  });

  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    testUser = await User.create({
      username: 'profileuser',
      email: 'profile@example.com',
      password: await bcrypt.hash('password123', 10),
      is_verified: true,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      bio: 'Test user bio',
      date_of_birth: '1990-01-01',
      profile_picture_url: '/uploads/profiles/old-pic.jpg'
    });

    req = {
      userId: testUser.id,
      user: testUser,
      body: {},
      file: null,
      params: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
  });

  describe('updateProfile method - Enhanced', () => {
    it('should update basic profile information', async () => {
      req.body = {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1987654321',
        bio: 'Updated bio',
        date_of_birth: '1992-05-15'
      };

      await profileController.updateProfile(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.data.first_name).to.equal('Jane');
      expect(responseData.data.last_name).to.equal('Smith');
      expect(responseData.data.phone).to.equal('+1987654321');
      expect(responseData.data.bio).to.equal('Updated bio');

      // Verify database update
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.first_name).to.equal('Jane');
      expect(updatedUser.last_name).to.equal('Smith');
    });

    it('should validate phone number format', async () => {
      req.body = {
        phone: '123' // Invalid phone format
      };

      await profileController.updateProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('phone number');
    });

    it('should validate date of birth', async () => {
      req.body = {
        date_of_birth: '2030-01-01' // Future date
      };

      await profileController.updateProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('birth');
    });

    it('should handle bio length validation', async () => {
      req.body = {
        bio: 'a'.repeat(1001) // Too long bio
      };

      await profileController.updateProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('bio');
    });
  });

  describe('uploadProfilePicture method', () => {
    it('should upload profile picture successfully', async () => {
      const mockFile = {
        filename: 'profile-123.jpg',
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        path: '/uploads/profiles/profile-123.jpg'
      };

      req.file = mockFile;

      // Mock image processor
      const mockImageProcessor = {
        processImage: sinon.stub().returns(Promise.resolve({
          webp: { path: '/uploads/profiles/profile-123.webp', size: 1024 },
          thumbnail: { path: '/uploads/profiles/thumb-123.jpg', size: 512 }
        }))
      };

      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(...args) {
        if (args[0] === '../utils/imageProcessor') return mockImageProcessor;
        return originalRequire.apply(this, args);
      };

      try {
        await profileController.uploadProfilePicture(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('uploaded successfully');
        expect(responseData.data.profile_picture_url).to.exist;

        // Verify database update
        const updatedUser = await User.findByPk(testUser.id);
        expect(updatedUser.profile_picture_url).to.not.equal('/uploads/profiles/old-pic.jpg');
        expect(mockImageProcessor.processImage.calledOnce).to.be.true;
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should handle no file uploaded', async () => {
      req.file = null;

      await profileController.uploadProfilePicture(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('No file uploaded');
    });

    it('should validate image file type', async () => {
      const mockFile = {
        filename: 'document.txt',
        originalname: 'document.txt',
        mimetype: 'text/plain',
        size: 1024,
        path: '/uploads/profiles/document.txt'
      };

      req.file = mockFile;

      await profileController.uploadProfilePicture(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('image file');
    });

    it('should handle image processing errors', async () => {
      const mockFile = {
        filename: 'error-image.jpg',
        originalname: 'error.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        path: '/uploads/profiles/error-image.jpg'
      };

      req.file = mockFile;

      const mockImageProcessor = {
        processImage: sinon.stub().throws(new Error('Image processing failed'))
      };

      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(...args) {
        if (args[0] === '../utils/imageProcessor') return mockImageProcessor;
        return originalRequire.apply(this, args);
      };

      try {
        await profileController.uploadProfilePicture(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.message).to.contain('processing failed');
      } finally {
        Module.prototype.require = originalRequire;
      }
    });
  });

  describe('changePassword method', () => {
    it('should change password with correct current password', async () => {
      req.body = {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456'
      };

      await profileController.changePassword(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.contain('changed successfully');

      // Verify password was actually changed
      const updatedUser = await User.findByPk(testUser.id);
      const isNewPasswordValid = await bcrypt.compare('newPassword456', updatedUser.password);
      expect(isNewPasswordValid).to.be.true;
    });

    it('should reject incorrect current password', async () => {
      req.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456'
      };

      await profileController.changePassword(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('current password is incorrect');
    });

    it('should reject mismatched password confirmation', async () => {
      req.body = {
        currentPassword: 'password123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword789'
      };

      await profileController.changePassword(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('passwords do not match');
    });

    it('should validate new password strength', async () => {
      req.body = {
        currentPassword: 'password123',
        newPassword: '123', // Too weak
        confirmPassword: '123'
      };

      await profileController.changePassword(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('password must be');
    });

    it('should prevent reusing current password', async () => {
      req.body = {
        currentPassword: 'password123',
        newPassword: 'password123', // Same as current
        confirmPassword: 'password123'
      };

      await profileController.changePassword(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('same as current');
    });
  });

  describe('getProfileStats method', () => {
    beforeEach(async () => {
      // Update user with some activity data
      await testUser.update({
        last_login_at: new Date('2024-01-15'),
        login_count: 25,
        created_at: new Date('2024-01-01')
      });
    });

    it('should return comprehensive profile statistics', async () => {
      await profileController.getProfileStats(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.data).to.have.property('accountAge');
      expect(responseData.data).to.have.property('loginCount', 25);
      expect(responseData.data).to.have.property('lastLoginAt');
      expect(responseData.data).to.have.property('profileCompletion');
      expect(responseData.data).to.have.property('verificationStatus');

      // Verify profile completion calculation
      expect(responseData.data.profileCompletion).to.be.a('number');
      expect(responseData.data.profileCompletion).to.be.at.least(0);
      expect(responseData.data.profileCompletion).to.be.at.most(100);
    });

    it('should calculate profile completion percentage correctly', async () => {
      // Update user with complete profile
      await testUser.update({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        bio: 'Complete bio',
        date_of_birth: '1990-01-01',
        profile_picture_url: '/uploads/profiles/pic.jpg'
      });

      await profileController.getProfileStats(req, res);

      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.profileCompletion).to.equal(100);
    });

    it('should handle user with minimal profile data', async () => {
      // Create user with minimal data
      const minimalUser = await User.create({
        username: 'minimal',
        email: 'minimal@example.com',
        password: 'password123',
        is_verified: false
      });

      req.userId = minimalUser.id;
      req.user = minimalUser;

      await profileController.getProfileStats(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.profileCompletion).to.be.lessThan(50);
      expect(responseData.data.verificationStatus).to.be.false;
    });
  });

  describe('updateSecuritySettings method', () => {
    it('should update two-factor authentication setting', async () => {
      req.body = {
        two_factor_enabled: true,
        notification_preferences: {
          email_notifications: true,
          security_alerts: true
        }
      };

      await profileController.updateSecuritySettings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.contain('updated successfully');

      // Verify database update
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.two_factor_enabled).to.be.true;
      expect(updatedUser.notification_preferences).to.be.an('object');
    });

    it('should update session timeout preference', async () => {
      req.body = {
        session_timeout: 3600 // 1 hour in seconds
      };

      await profileController.updateSecuritySettings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.session_timeout).to.equal(3600);
    });

    it('should validate session timeout range', async () => {
      req.body = {
        session_timeout: 60 // Too short (1 minute)
      };

      await profileController.updateSecuritySettings(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('timeout');
    });

    it('should handle invalid security settings', async () => {
      req.body = {
        two_factor_enabled: 'invalid', // Should be boolean
        invalid_field: 'should be ignored'
      };

      await profileController.updateSecuritySettings(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
    });
  });

  describe('deleteProfile method', () => {
    it('should delete profile with correct password confirmation', async () => {
      req.body = {
        password: 'password123',
        confirmation: 'DELETE_MY_ACCOUNT'
      };

      // Mock file system operations for profile picture deletion
      const mockFs = require('fs').promises;
      const originalUnlink = mockFs.unlink;
      mockFs.unlink = sinon.stub().resolves();

      try {
        await profileController.deleteProfile(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('deleted successfully');

        // Verify user was soft-deleted
        const deletedUser = await User.findByPk(testUser.id);
        expect(deletedUser).to.be.null; // Should be null due to soft delete
      } finally {
        mockFs.unlink = originalUnlink;
      }
    });

    it('should reject deletion with incorrect password', async () => {
      req.body = {
        password: 'wrongPassword',
        confirmation: 'DELETE_MY_ACCOUNT'
      };

      await profileController.deleteProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('password is incorrect');

      // Verify user was not deleted
      const stillExists = await User.findByPk(testUser.id);
      expect(stillExists).to.exist;
    });

    it('should reject deletion without proper confirmation', async () => {
      req.body = {
        password: 'password123',
        confirmation: 'wrong confirmation'
      };

      await profileController.deleteProfile(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('confirmation');
    });
  });

  describe('exportProfileData method', () => {
    it('should export user profile data', async () => {
      await profileController.exportProfileData(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.data).to.have.property('profile');
      expect(responseData.data).to.have.property('exportedAt');
      expect(responseData.data.profile).to.have.property('username');
      expect(responseData.data.profile).to.have.property('email');
      
      // Verify sensitive data is excluded
      expect(responseData.data.profile).to.not.have.property('password');
      expect(responseData.data.profile).to.not.have.property('verification_token');
      expect(responseData.data.profile).to.not.have.property('reset_token');
    });

    it('should include activity statistics in export', async () => {
      await testUser.update({
        login_count: 50,
        last_login_at: new Date()
      });

      await profileController.exportProfileData(req, res);

      const responseData = res.json.firstCall.args[0];
      expect(responseData.data).to.have.property('statistics');
      expect(responseData.data.statistics).to.have.property('loginCount');
      expect(responseData.data.statistics).to.have.property('accountAge');
    });
  });
});