/**
 * Controller tests - Unit tests for controller logic
 */
const expect = require('chai').expect;
const sinon = require('sinon');
const bcrypt = require('bcrypt');

// Import controllers
const authController = require('../src/controllers/authController');
const profileController = require('../src/controllers/profileController');
const adminController = require('../src/controllers/adminController');

// Import utilities
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('Controllers', () => {
  let User;

  before(async function() {
    this.timeout(10000);
    await setupTestDatabase();
    const testModels = getTestModels();
    User = testModels.User;
  });

  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis()
      };
    });

    describe('register method', () => {
      it('should register a new user successfully', async () => {
        req.body = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        };

        await authController.register(req, res);

        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledOnce).to.be.true;

        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('Registration successful');

        // Verify user was created in database
        const user = await User.findOne({ where: { email: 'test@example.com' } });
        expect(user).to.exist;
        expect(user.username).to.equal('testuser');
        expect(user.is_verified).to.be.false;
      });

      it('should handle duplicate email registration', async () => {
        // Create existing user
        await User.create({
          username: 'existinguser',
          email: 'test@example.com',
          password: 'password123'
        });

        req.body = {
          username: 'newuser',
          email: 'test@example.com', // duplicate email
          password: 'password456'
        };

        await authController.register(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.field).to.equal('email');
        expect(responseData.errors.message).to.contain('already exists');
      });

      it('should handle duplicate username registration', async () => {
        // Create existing user
        await User.create({
          username: 'testuser',
          email: 'existing@example.com',
          password: 'password123'
        });

        req.body = {
          username: 'testuser', // duplicate username
          email: 'test@example.com',
          password: 'password456'
        };

        await authController.register(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.field).to.equal('username');
        expect(responseData.errors.message).to.contain('already exists');
      });

      it('should validate required fields', async () => {
        req.body = {
          username: 'testuser',
          email: 'test@example.com'
          // missing password
        };

        await authController.register(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.message).to.contain('fill in all fields');
      });

      it('should validate password length', async () => {
        req.body = {
          username: 'testuser',
          email: 'test@example.com',
          password: '12345' // too short
        };

        await authController.register(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.message).to.contain('at least 6 characters');
      });
    });

    describe('login method', () => {
      beforeEach(async () => {
        // Create a verified user for login tests
        await User.create({
          username: 'loginuser',
          email: 'login@example.com',
          password: await bcrypt.hash('password123', 10),
          is_verified: true
        });
      });

      it('should login verified user with correct credentials', async () => {
        req.body = {
          email: 'login@example.com',
          password: 'password123'
        };

        await authController.login(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('Login successful');
        expect(responseData.data.token).to.exist;
        expect(responseData.data.user.email).to.equal('login@example.com');
      });

      it('should reject login with wrong password', async () => {
        req.body = {
          email: 'login@example.com',
          password: 'wrongpassword'
        };

        await authController.login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.message).to.contain('Invalid email or password');
      });

      it('should reject login for non-existent user', async () => {
        req.body = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };

        await authController.login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.message).to.contain('Invalid email or password');
      });

      it('should reject login for unverified user', async () => {
        // Create unverified user
        await User.create({
          username: 'unverifieduser',
          email: 'unverified@example.com',
          password: await bcrypt.hash('password123', 10),
          is_verified: false
        });

        req.body = {
          email: 'unverified@example.com',
          password: 'password123'
        };

        await authController.login(req, res);

        expect(res.status.calledWith(403)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.message).to.contain('verify your email');
      });
    });

    describe('verifyEmail method', () => {
      it('should verify user with valid token', async () => {
        const verificationToken = 'valid-verification-token';
        
        await User.create({
          username: 'verifyuser',
          email: 'verify@example.com',
          password: 'password123',
          is_verified: false,
          verification_token: verificationToken
        });

        req.body = { token: verificationToken };

        await authController.verifyEmail(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('verified successfully');

        // Check user is now verified
        const user = await User.findOne({ where: { email: 'verify@example.com' } });
        expect(user.is_verified).to.be.true;
        expect(user.verification_token).to.be.null;
      });

      it('should reject invalid verification token', async () => {
        req.body = { token: 'invalid-token' };

        await authController.verifyEmail(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.message).to.contain('Invalid verification token');
      });
    });

    describe('forgotPassword method', () => {
      beforeEach(async () => {
        await User.create({
          username: 'resetuser',
          email: 'reset@example.com',
          password: 'password123',
          is_verified: true
        });
      });

      it('should initiate password reset for existing email', async () => {
        req.body = { email: 'reset@example.com' };

        await authController.forgotPassword(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('password reset link');

        // Check reset token was set
        const user = await User.findOne({ where: { email: 'reset@example.com' } });
        expect(user.reset_token).to.exist;
        expect(user.reset_token_expires_at).to.exist;
      });

      it('should return success for non-existent email (security)', async () => {
        req.body = { email: 'nonexistent@example.com' };

        await authController.forgotPassword(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('password reset link');
      });
    });

    describe('resetPassword method', () => {
      let resetToken;

      beforeEach(async () => {
        resetToken = 'valid-reset-token';
        const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        await User.create({
          username: 'resetuser',
          email: 'reset@example.com',
          password: 'oldpassword123',
          is_verified: true,
          reset_token: resetToken,
          reset_token_expires_at: resetTokenExpiresAt
        });
      });

      it('should reset password with valid token', async () => {
        req.body = {
          token: resetToken,
          password: 'newpassword123'
        };

        await authController.resetPassword(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('reset successfully');

        // Check reset token was cleared
        const user = await User.findOne({ where: { email: 'reset@example.com' } });
        expect(user.reset_token).to.be.null;
        expect(user.reset_token_expires_at).to.be.null;
      });

      it('should reject invalid reset token', async () => {
        req.body = {
          token: 'invalid-token',
          password: 'newpassword123'
        };

        await authController.resetPassword(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.message).to.contain('Invalid or expired');
      });

      it('should validate new password length', async () => {
        req.body = {
          token: resetToken,
          password: '12345' // too short
        };

        await authController.resetPassword(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.false;
        expect(responseData.errors.message).to.contain('at least 6 characters');
      });
    });

    describe('logout method', () => {
      it('should handle logout request', async () => {
        await authController.logout(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('Logout successful');
      });
    });
  });

  describe('Profile Controller', () => {
    let req, res, testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123',
        is_verified: true
      });

      req = {
        userId: testUser.id,
        body: {}
      };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis()
      };
    });

    describe('getProfile method', () => {
      it('should return user profile for authenticated user', async () => {
        await profileController.getProfile(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.id).to.equal(testUser.id);
        expect(responseData.username).to.equal('profileuser');
        expect(responseData.email).to.equal('profile@example.com');
        expect(responseData.password).to.be.undefined; // Should not include password
      });

      it('should handle non-existent user', async () => {
        req.userId = 99999; // Non-existent user ID

        await profileController.getProfile(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ error: 'User not found' })).to.be.true;
      });
    });

    describe('updateProfile method', () => {
      it('should update user profile successfully', async () => {
        req.body = {
          username: 'updateduser',
          email: 'updated@example.com'
        };

        await profileController.updateProfile(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.username).to.equal('updateduser');
        expect(responseData.email).to.equal('updated@example.com');

        // Verify database was updated
        const updatedUser = await User.findByPk(testUser.id);
        expect(updatedUser.username).to.equal('updateduser');
        expect(updatedUser.email).to.equal('updated@example.com');
      });

      it('should handle non-existent user during update', async () => {
        req.userId = 99999; // Non-existent user ID
        req.body = { username: 'newname' };

        await profileController.updateProfile(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ error: 'User not found' })).to.be.true;
      });

      it('should handle database constraint errors during update', async () => {
        // Create another user with the email we're trying to update to (this should cause a constraint error)
        await User.create({
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'password123'
        });

        req.body = {
          username: 'profileuser',
          email: 'another@example.com' // This should cause a unique constraint error
        };

        await profileController.updateProfile(req, res);

        // Should handle the constraint error gracefully
        expect(res.status.called).to.be.true;
        expect(res.json.called).to.be.true;
      });
    });
  });

  describe('Admin Controller', () => {
    let req, res, adminUser, regularUser;

    beforeEach(async () => {
      adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        is_verified: true
      });

      regularUser = await User.create({
        username: 'regularuser',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
        is_verified: true
      });

      req = {
        userId: adminUser.id,
        userRole: 'admin',
        params: {},
        body: {}
      };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis()
      };
    });

    describe('getAllUsers method', () => {
      it('should return all users for admin', async () => {
        await adminController.getAllUsers(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.be.an('array');
        expect(responseData.length).to.equal(2);
        
        // Check that passwords are excluded
        responseData.forEach(user => {
          expect(user.password).to.be.undefined;
          expect(user.verification_token).to.be.undefined;
          expect(user.reset_token).to.be.undefined;
        });
      });

      it('should handle admin operations correctly', async () => {
        // This test verifies the admin controller works with valid operations
        expect(res.json.called).to.be.false; // Not yet called
        
        await adminController.getAllUsers(req, res);
        
        expect(res.json.called).to.be.true;
      });
    });

    describe('updateUserRole method', () => {
      it('should update user role successfully', async () => {
        req.params.id = regularUser.id.toString();
        req.body.role = 'admin';

        await adminController.updateUserRole(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.role).to.equal('admin');

        // Verify database was updated
        const updatedUser = await User.findByPk(regularUser.id);
        expect(updatedUser.role).to.equal('admin');
      });

      it('should handle non-existent user', async () => {
        req.params.id = '99999'; // Non-existent user ID
        req.body.role = 'admin';

        await adminController.updateUserRole(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ error: 'User not found' })).to.be.true;
      });

      it('should handle invalid role values', async () => {
        req.params.id = regularUser.id.toString();
        req.body.role = 'invalid-role';

        await adminController.updateUserRole(req, res);

        expect(res.status.calledWith(400)).to.be.true;
      });
    });

    describe('deleteUser method', () => {
      it('should delete user successfully', async () => {
        req.params.id = regularUser.id.toString();

        await adminController.deleteUser(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.message).to.contain('deleted successfully');

        // Verify user was deleted
        const deletedUser = await User.findByPk(regularUser.id);
        expect(deletedUser).to.be.null;
      });

      it('should handle non-existent user deletion', async () => {
        req.params.id = '99999'; // Non-existent user ID

        await adminController.deleteUser(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ error: 'User not found' })).to.be.true;
      });

      it('should handle admin delete operations correctly', async () => {
        req.params.id = regularUser.id.toString();

        await adminController.deleteUser(req, res);

        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.message).to.contain('deleted successfully');

        // Verify user was deleted
        const deletedUser = await User.findByPk(regularUser.id);
        expect(deletedUser).to.be.null;
      });
    });
  });
});