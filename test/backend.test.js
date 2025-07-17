const expect = require('chai').expect;
const request = require('supertest');
const { app, ready } = require('../src/server');
const { User } = require('../src/database');
const nodemailer = require('nodemailer');
const sinon = require('sinon');

describe('Auth API', () => {
  before(async () => {
    await ready;
    // Mock nodemailer
    sinon.stub(nodemailer, 'createTransport').returns({
      sendMail: (mailOptions, callback) => {
        if (callback) {
          callback(null, 'mock-response');
        } else {
          return Promise.resolve('mock-response');
        }
      },
    });
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .then(res => {
          expect(res.body.message).to.equal('Registration successful. Please check your email to verify your account.');
        });
    });

    it('should not register a user with missing username', async () => {
      return request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Please fill in all fields.');
        });
    });

    it('should not register a user with missing email', async () => {
      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Please fill in all fields.');
        });
    });

    it('should not register a user with missing password', async () => {
      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Please fill in all fields.');
        });
    });

    it('should not register a user with password too short', async () => {
      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Password must be at least 6 characters long.');
        });
    });

    it('should not register a user with an existing email', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Email already exists.');
        });
    });

    it('should not register a user with an existing username', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      return request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password456',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Username already exists.');
        });
    });
  });

  describe('POST /api/login', () => {
    it('should login a verified user', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });

      return request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('Login successful!');
          expect(res.body.token).to.exist;
        });
    });

    it('should not login an unverified user', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      return request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(403)
        .then(res => {
          expect(res.body.error).to.equal('Please verify your email before logging in.');
        });
    });

    it('should not login with invalid email', async () => {
      return request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)
        .then(res => {
          expect(res.body.error).to.equal('Invalid email or password.');
        });
    });

    it('should not login with invalid password', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });

      return request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .then(res => {
          expect(res.body.error).to.equal('Invalid email or password.');
        });
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      return request(app)
        .post('/api/logout')
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('Logout successful.');
        });
    });
  });

  describe('POST /api/verify-email', () => {
    it('should verify email with a valid token', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'verifyuser',
          email: 'verify@example.com',
          password: 'password123',
        });

      const user = await User.findOne({ where: { email: 'verify@example.com' } });
      const verificationToken = user.verification_token;

      return request(app)
        .post('/api/verify-email')
        .send({ token: verificationToken })
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('Email verified successfully. You can now log in.');
        });
    });

    it('should not verify email with an invalid token', async () => {
      return request(app)
        .post('/api/verify-email')
        .send({ token: 'invalidtoken' })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Invalid verification token.');
        });
    });
  });

  describe('POST /api/forgot-password', () => {
    it('should send a reset link for a registered email', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'forgotuser',
          email: 'forgot@example.com',
          password: 'password123',
        });

      return request(app)
        .post('/api/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
        });
    });

    it('should not send a reset link for an unregistered email', async () => {
      return request(app)
        .post('/api/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('If your email address is in our database, you will receive a password reset link.');
        });
    });
  });

  describe('POST /api/reset-password', () => {
    it('should reset password with a valid token', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'resetuser',
          email: 'reset@example.com',
          password: 'oldpassword',
        });

      await request(app)
        .post('/api/forgot-password')
        .send({ email: 'reset@example.com' });

      const user = await User.findOne({ where: { email: 'reset@example.com' } });
      const resetToken = user.reset_token;

      return request(app)
        .post('/api/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword',
        })
        .expect(200)
        .then(res => {
          expect(res.body.message).to.equal('Password has been reset successfully.');
        });
    });

    it('should not reset password with an invalid token', async () => {
      return request(app)
        .post('/api/reset-password')
        .send({
          token: 'invalidtoken',
          password: 'newpassword',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Invalid or expired password reset token.');
        });
    });

    it('should not reset password with an expired token', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'expireduser',
          email: 'expired@example.com',
          password: 'oldpassword',
        });

      await request(app)
        .post('/api/forgot-password')
        .send({ email: 'expired@example.com' });

      // Manually set the token to be expired
      await User.update({ reset_token_expires_at: new Date(Date.now() - 3600000) }, { where: { email: 'expired@example.com' } });

      const user = await User.findOne({ where: { email: 'expired@example.com' } });
      const resetToken = user.reset_token;

      return request(app)
        .post('/api/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Invalid or expired password reset token.');
        });
    });

    it('should not reset password with password too short', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'shortpassuser',
          email: 'shortpass@example.com',
          password: 'oldpassword',
        });

      await request(app)
        .post('/api/forgot-password')
        .send({ email: 'shortpass@example.com' });

      const user = await User.findOne({ where: { email: 'shortpass@example.com' } });
      const resetToken = user.reset_token;

      return request(app)
        .post('/api/reset-password')
        .send({
          token: resetToken,
          password: '123',
        })
        .expect(400)
        .then(res => {
          expect(res.body.error).to.equal('Password must be at least 6 characters long.');
        });
    });
  });

  describe('USER PROFILE ROUTES', () => {
    let authToken;

    beforeEach(async () => {
      await User.destroy({ where: {} });
      await request(app)
        .post('/api/register')
        .send({
          username: 'profileuser',
          email: 'profile@example.com',
          password: 'password123',
        });
      await User.update({ is_verified: true }, { where: { email: 'profile@example.com' } });

      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'profile@example.com',
          password: 'password123',
        });
      authToken = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      return request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then(res => {
          expect(res.body.username).to.equal('profileuser');
          expect(res.body.email).to.equal('profile@example.com');
        });
    });

    it('should not get user profile with invalid token', async () => {
      return request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401)
        .then(res => {
          expect(res.body.error).to.equal('Invalid token.');
        });
    });

    it('should update user profile with valid token', async () => {
      return request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        })
        .expect(200)
        .then(res => {
          expect(res.body.username).to.equal('updateduser');
          expect(res.body.email).to.equal('updated@example.com');
        });
    });

    it('should not update user profile with invalid token', async () => {
      return request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        })
        .expect(401)
        .then(res => {
          expect(res.body.error).to.equal('Invalid token.');
        });
    });
  });

  describe('ADMIN ROUTES', () => {
    let adminToken;
    let regularUserToken;
    let regularUserId;

    beforeEach(async () => {
      await User.destroy({ where: {} });

      // Register and verify admin user
      await request(app)
        .post('/api/register')
        .send({
          username: 'adminuser',
          email: 'admin@example.com',
          password: 'adminpassword',
        });
      await User.update({ is_verified: true, role: 'admin' }, { where: { email: 'admin@example.com' } });
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword',
        });
      adminToken = adminLoginRes.body.token;

      // Register and verify regular user
      await request(app)
        .post('/api/register')
        .send({
          username: 'regularuser',
          email: 'regular@example.com',
          password: 'regularpassword',
        });
      await User.update({ is_verified: true }, { where: { email: 'regular@example.com' } });
      const regularLoginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'regular@example.com',
          password: 'regularpassword',
        });
      regularUserToken = regularLoginRes.body.token;
      regularUserId = regularLoginRes.body.user.id;
    });

    describe('GET /api/admin/users', () => {
      it('should get all users as admin', async () => {
        return request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(2);
            expect(res.body[0]).to.have.property('username');
            expect(res.body[0]).to.not.have.property('password');
          });
      });

      it('should not get all users as regular user', async () => {
        return request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(403)
          .then(res => {
            expect(res.body.error).to.equal('Forbidden');
          });
      });

      it('should not get all users without token', async () => {
        return request(app)
          .get('/api/admin/users')
          .expect(401)
          .then(res => {
            expect(res.body.error).to.equal('No token provided.');
          });
      });
    });

    describe('PUT /api/admin/users/:id/role', () => {
      it('should update user role as admin', async () => {
        return request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'admin' })
          .expect(200)
          .then(res => {
            expect(res.body.role).to.equal('admin');
          });
      });

      it('should not update user role as regular user', async () => {
        return request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ role: 'admin' })
          .expect(403)
          .then(res => {
            expect(res.body.error).to.equal('Forbidden');
          });
      });

      it('should not update user role without token', async () => {
        return request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .send({ role: 'admin' })
          .expect(401)
          .then(res => {
            expect(res.body.error).to.equal('No token provided.');
          });
      });
    });

    describe('DELETE /api/admin/users/:id', () => {
      it('should delete user as admin', async () => {
        return request(app)
          .delete(`/api/admin/users/${regularUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.message).to.equal('User deleted successfully.');
          });
      });

      it('should not delete user as regular user', async () => {
        return request(app)
          .delete(`/api/admin/users/${regularUserId}`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(403)
          .then(res => {
            expect(res.body.error).to.equal('Forbidden');
          });
      });

      it('should not delete user without token', async () => {
        return request(app)
          .delete(`/api/admin/users/${regularUserId}`)
          .expect(401)
          .then(res => {
            expect(res.body.error).to.equal('No token provided.');
          });
      });
    });
  });
});
