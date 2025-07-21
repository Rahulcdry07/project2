const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const { User, sequelize } = require('../src/database');
const bcrypt = require('bcrypt');

describe('Security Tests', () => {
  let server;
  let testUser;
  let adminUser;
  let testUserToken;
  let adminToken;

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

  describe('JWT Authentication', () => {
    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      testUserToken = loginResponse.body.token;
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.error).to.equal('No token provided.');
    });

    it('should reject requests with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.error).to.equal('No token provided.');
    });

    it('should reject requests with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.error).to.equal('Invalid token.');
    });

    it('should reject requests with expired JWT token', async () => {
      // Create a token that expires immediately
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).to.equal('Token expired.');
    });

    it('should accept requests with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.email).to.equal('test@example.com');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords during registration', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user.password).to.not.equal(userData.password);
      expect(user.password).to.include('$2b$'); // bcrypt hash format
    });

    it('should validate password strength during registration', async () => {
      const weakPasswords = [
        'weak',
        'password',
        '12345678',
        'Password',
        'password123',
        'PASSWORD123'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: password
          })
          .expect(400);

        expect(response.body.error).to.include('Password must be at least 8 characters long');
      }
    });

    it('should accept strong passwords during registration', async () => {
      const strongPasswords = [
        'Password123!',
        'MySecurePass1@',
        'ComplexP@ssw0rd',
        'Str0ng!Pass'
      ];

      for (let i = 0; i < strongPasswords.length; i++) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: `testuser${i}`,
            email: `test${i}@example.com`,
            password: strongPasswords[i]
          })
          .expect(201);

        expect(response.body.message).to.include('Registration successful');
      }
    });

    it('should verify password during login', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        is_verified: true
      });

      // Correct password
      const correctResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'correctpassword' })
        .expect(200);

      expect(correctResponse.body.message).to.equal('Login successful!');

      // Incorrect password
      const incorrectResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(incorrectResponse.body.error).to.equal('Invalid email or password.');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example..com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: 'testuser',
            email: email,
            password: 'Password123!'
          })
          .expect(400);

        expect(response.body.error).to.include('valid email address');
      }
    });

    it('should validate username format', async () => {
      const invalidUsernames = [
        'te', // too short
        'a'.repeat(31), // too long
        'user@name', // invalid characters
        'user name', // spaces
        'user-name' // hyphens
      ];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: username,
            email: 'test@example.com',
            password: 'Password123!'
          })
          .expect(400);

        expect(response.body.error).to.include('Username must be 3-30 characters long');
      }
    });

    it('should normalize email addresses', async () => {
      const testEmails = [
        'TEST@EXAMPLE.COM',
        'test@EXAMPLE.com',
        'Test@Example.Com'
      ];

      for (const email of testEmails) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: 'testuser',
            email: email,
            password: 'Password123!'
          })
          .expect(201);

        // Check that email was normalized to lowercase
        const user = await User.findOne({ where: { username: 'testuser' } });
        expect(user.email).to.equal('test@example.com');
      }
    });

    it('should prevent SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com', 'password'); --"
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/register')
          .send({
            username: maliciousInput,
            email: 'test@example.com',
            password: 'Password123!'
          })
          .expect(400);

        // Should fail validation, not cause SQL error
        expect(response.body.error).to.include('Username must be 3-30 characters long');
      }
    });
  });

  describe('Authorization and Access Control', () => {
    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      adminUser = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'admin'
      });

      const userLoginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      testUserToken = userLoginResponse.body.token;

      const adminLoginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'admin@example.com', password: 'password' });
      
      adminToken = adminLoginResponse.body.token;
    });

    it('should allow admin to update user roles', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.role).to.equal('admin');
    });

    it('should prevent regular users from updating roles', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body.error).to.equal('Forbidden');
    });

    it('should allow admin to delete users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).to.equal('User deleted successfully.');
    });

    it('should prevent regular users from deleting users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.error).to.equal('Forbidden');
    });

    it('should prevent users from accessing other users profiles', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword',
        is_verified: true,
        role: 'user'
      });

      // Users can only access their own profile via the /api/profile endpoint
      // The endpoint uses the JWT token to identify the user
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.id).to.equal(testUser.id);
      expect(response.body.id).to.not.equal(otherUser.id);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit authentication attempts per IP', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make 5 attempts (limit)
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

    it('should limit registration attempts per IP', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      // Make 5 attempts (limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/register')
          .send(userData)
          .expect(201);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser6',
          email: 'test6@example.com',
          password: 'Password123!'
        })
        .expect(429);

      expect(response.body.error).to.include('Too many authentication attempts');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      // Check for security headers
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-xss-protection');
      expect(response.headers).to.have.property('content-security-policy');
    });

    it('should prevent clickjacking with X-Frame-Options', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['x-frame-options']).to.equal('DENY');
    });

    it('should prevent MIME type sniffing', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['x-content-type-options']).to.equal('nosniff');
    });
  });

  describe('Token Security', () => {
    it('should not expose sensitive information in JWT tokens', async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200);

      const token = loginResponse.body.token;
      
      // Decode JWT token (without verification)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      // Check that sensitive data is not in token
      expect(decoded).to.not.have.property('password');
      expect(decoded).to.not.have.property('email');
      expect(decoded).to.have.property('userId');
      expect(decoded).to.have.property('role');
      expect(decoded).to.have.property('iat'); // issued at
      expect(decoded).to.have.property('exp'); // expiration
    });

    it('should have reasonable token expiration time', async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        is_verified: true,
        role: 'user'
      });

      const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200);

      const token = loginResponse.body.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      // Check expiration time (should be 30 minutes = 1800 seconds)
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp - now;
      
      expect(expirationTime).to.be.approximately(1800, 60); // Allow 1 minute tolerance
    });
  });
});
