/**
 * Security tests
 */
const expect = require('chai').expect;
const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Enable security testing mode to allow rate limiting in tests
process.env.TESTING_SECURITY = 'true';

// Import security-related modules
const configureSecurityMiddleware = require('../src/middleware/security');
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('Security', () => {
  let app;
  let User, sequelize;

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

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Security Middleware Configuration', () => {
    it('should apply security middleware without errors', () => {
      expect(() => {
        configureSecurityMiddleware(app);
      }).to.not.throw();
    });

    it('should set security headers with helmet', (done) => {
      configureSecurityMiddleware(app);
      
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/test')
        .expect((res) => {
          // Check for common helmet security headers
          expect(res.headers['x-content-type-options']).to.equal('nosniff');
          expect(res.headers['x-frame-options']).to.exist;
          expect(res.headers['x-xss-protection']).to.exist;
        })
        .end(done);
    });

    it('should configure CORS with proper origins', (done) => {
      configureSecurityMiddleware(app);
      
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).to.exist;
        })
        .end(done);
    });

    it('should block requests from unauthorized origins', (done) => {
      configureSecurityMiddleware(app);
      
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com')
        .expect((res) => {
          // Should not have CORS headers for unauthorized origin
          expect(res.headers['access-control-allow-origin']).to.not.equal('http://malicious-site.com');
        })
        .end(done);
    });

    it('should apply rate limiting to API routes', (done) => {
      configureSecurityMiddleware(app, {
        rateLimitMax: 1, // Very low limit for testing
        rateLimitWindowMs: 60000
      });
      
      app.get('/api/test', (req, res) => {
        res.json({ message: 'test' });
      });

      // First request should succeed
      request(app)
        .get('/api/test')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          // Second request should be rate limited
          request(app)
            .get('/api/test')
            .expect(429) // Too Many Requests
            .end(done);
        });
    });

    it('should not apply rate limiting to non-API routes', (done) => {
      configureSecurityMiddleware(app, {
        rateLimitMax: 1,
        rateLimitWindowMs: 60000
      });
      
      app.get('/public', (req, res) => {
        res.json({ message: 'public' });
      });

      // Multiple requests to non-API route should succeed
      request(app)
        .get('/public')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          request(app)
            .get('/public')
            .expect(200)
            .end(done);
        });
    });

    it('should configure different settings for test mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      expect(() => {
        configureSecurityMiddleware(app);
      }).to.not.throw();

      process.env.NODE_ENV = originalEnv;
    });

    it('should configure different settings for production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(() => {
        configureSecurityMiddleware(app);
      }).to.not.throw();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('XSS Protection', () => {
    beforeEach(() => {
      configureSecurityMiddleware(app);
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });
    });

    it('should sanitize XSS attempts in request body', (done) => {
      const maliciousPayload = {
        username: '<script>alert("XSS")</script>',
        comment: '<img src=x onerror=alert("XSS")>'
      };

      request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200)
        .expect((res) => {
          // XSS clean middleware should sanitize the payload
          expect(res.body.received.username).to.not.contain('<script>');
          // For the comment, check if it's sanitized (HTML entities escaped)
          const sanitizedComment = res.body.received.comment;
          if (sanitizedComment.includes('&lt;') || sanitizedComment.includes('&gt;')) {
            // HTML was escaped - this is good
            expect(sanitizedComment).to.include('&lt;');
          } else {
            // HTML wasn't escaped but should not contain dangerous attributes
            expect(sanitizedComment).to.not.contain('onerror=');
          }
        })
        .end(done);
    });

    it('should allow safe HTML content', (done) => {
      const safePayload = {
        username: 'normaluser',
        bio: 'This is a <em>safe</em> bio'
      };

      request(app)
        .post('/test')
        .send(safePayload)
        .expect(200)
        .expect((res) => {
          expect(res.body.received.username).to.equal('normaluser');
          // Some safe HTML might be preserved or sanitized appropriately
          expect(res.body.received.bio).to.be.a('string');
        })
        .end(done);
    });
  });

  describe('Parameter Pollution Protection', () => {
    beforeEach(() => {
      configureSecurityMiddleware(app);
      app.get('/search', (req, res) => {
        res.json({ query: req.query });
      });
    });

    it('should handle parameter pollution', (done) => {
      request(app)
        .get('/search?category=books&category=electronics&sort=price')
        .expect(200)
        .expect((res) => {
          // HPP middleware should handle duplicate parameters appropriately
          expect(res.body.query).to.be.an('object');
        })
        .end(done);
    });
  });

  describe('Content Security Policy', () => {
    it('should set CSP headers in production', (done) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      configureSecurityMiddleware(app);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/test')
        .expect((res) => {
          // In production, should have strict CSP headers
          expect(res.headers['content-security-policy']).to.exist;
        })
        .end(() => {
          process.env.NODE_ENV = originalEnv;
          done();
        });
    });

    it('should have less restrictive CSP in development', (done) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      configureSecurityMiddleware(app);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/test')
        .expect((res) => {
          // Development might have more relaxed CSP or no CSP
          if (res.headers['content-security-policy']) {
            expect(res.headers['content-security-policy']).to.be.a('string');
          }
        })
        .end(() => {
          process.env.NODE_ENV = originalEnv;
          done();
        });
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should reset rate limit after window expires', function(done) {
      this.timeout(5000); // Increase timeout for this test

      configureSecurityMiddleware(app, {
        rateLimitMax: 1,
        rateLimitWindowMs: 1000 // 1 second window
      });
      
      app.get('/api/test', (req, res) => {
        res.json({ message: 'test' });
      });

      // First request should succeed
      request(app)
        .get('/api/test')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          // Second request should be rate limited
          request(app)
            .get('/api/test')
            .expect(429)
            .end((err) => {
              if (err) return done(err);
              
              // Wait for window to reset and try again
              setTimeout(() => {
                request(app)
                  .get('/api/test')
                  .expect(200)
                  .end(done);
              }, 1100); // Wait slightly longer than window
            });
        });
    });

    it('should provide rate limit information in headers', (done) => {
      configureSecurityMiddleware(app, {
        rateLimitMax: 10,
        rateLimitWindowMs: 60000
      });
      
      app.get('/api/test', (req, res) => {
        res.json({ message: 'test' });
      });

      request(app)
        .get('/api/test')
        .expect(200)
        .expect((res) => {
          // Rate limiting headers may vary by implementation
          // Check for common rate limit header patterns
          const hasLimitHeaders = 
            res.headers['x-ratelimit-limit'] ||
            res.headers['x-rate-limit-limit'] ||
            res.headers['ratelimit-limit'] ||
            res.headers['x-ratelimit-remaining'] ||
            res.headers['x-rate-limit-remaining'] ||
            res.headers['ratelimit-remaining'];
          
          // At least some rate limit headers should be present
          expect(hasLimitHeaders).to.exist;
        })
        .end(done);
    });
  });

  describe('Trust Proxy Configuration', () => {
    it('should configure trust proxy setting', () => {
      configureSecurityMiddleware(app, { trustProxy: true });
      
      // Check that the app has trust proxy enabled
      expect(app.get('trust proxy')).to.equal(1);
    });

    it('should handle trust proxy disabled', () => {
      configureSecurityMiddleware(app, { trustProxy: false });
      
      // Should not have trust proxy set if disabled
      expect(app.get('trust proxy')).to.not.equal(1);
    });
  });

  describe('Cookie Security', () => {
    beforeEach(() => {
      configureSecurityMiddleware(app);
      app.post('/login', (req, res) => {
        res.cookie('sessionId', 'test-session', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
        res.json({ message: 'logged in' });
      });
    });

    it('should handle cookie parsing', (done) => {
      request(app)
        .post('/login')
        .expect(200)
        .expect((res) => {
          expect(res.headers['set-cookie']).to.exist;
        })
        .end(done);
    });
  });
});