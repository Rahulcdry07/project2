const expect = require('chai').expect;
const request = require('supertest');
const app = require('../src/server');
const { User } = require('../src/database');

describe('Auth API', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).to.equal(201);
      expect(res.body.message).to.equal('Registration successful. Please check your email to verify your account.');
    });

    it('should not register a user with an existing email', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        });

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.equal('Email already exists.');
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

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.equal('Login successful!');
      expect(res.body.token).to.exist;
    });

    it('should not login an unverified user', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(403);
      expect(res.body.error).to.equal('Please verify your email before logging in.');
    });
  });
});
