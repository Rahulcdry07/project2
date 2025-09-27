# Comprehensive Testing Examples

This guide provides comprehensive testing examples for the Dynamic Web Application API.

## Test Setup

### Prerequisites
```bash
npm install --save-dev jest supertest
```

### Test Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000
};
```

## Authentication Tests

### Registration Tests
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User'
  };

  test('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(validUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('registered successfully');
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(validUser.email.toLowerCase());
    expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
  });

  test('should fail with duplicate email', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send(validUser);

    // Duplicate registration
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'different' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already exists');
  });

  test('should fail with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'invalid-email' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  test('should fail with short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: '123' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors.field).toBe('password');
  });

  test('should fail with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });
});
```

### Login Tests
```javascript
describe('POST /api/auth/login', () => {
  let testUser;

  beforeEach(async () => {
    // Create and verify test user
    testUser = {
      email: 'login@example.com',
      password: 'SecurePass123!',
      username: 'loginuser',
      firstName: 'Login',
      lastName: 'User'
    };

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Mock email verification
    const { User } = require('../src/models');
    await User.update(
      { is_verified: true },
      { where: { email: testUser.email } }
    );
  });

  test('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.expiresIn).toBe(1800); // 30 minutes
  });

  test('should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid email or password');
  });

  test('should fail with unverified email', async () => {
    // Create unverified user
    const unverifiedUser = {
      email: 'unverified@example.com',
      password: 'SecurePass123!',
      username: 'unverified',
      firstName: 'Un',
      lastName: 'Verified'
    };

    await request(app)
      .post('/api/auth/register')
      .send(unverifiedUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: unverifiedUser.email,
        password: unverifiedUser.password
      })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('verify your email');
  });

  test('should enforce rate limiting', async () => {
    const loginData = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    // Make multiple failed attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .send(loginData);
    }

    // This should be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(429);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
  });
});
```

### Token Tests
```javascript
describe('JWT Token Management', () => {
  let accessToken, refreshToken, testUser;

  beforeEach(async () => {
    testUser = {
      email: 'token@example.com',
      password: 'SecurePass123!',
      username: 'tokenuser',
      firstName: 'Token',
      lastName: 'User'
    };

    // Register and verify user
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const { User } = require('../src/models');
    await User.update(
      { is_verified: true },
      { where: { email: testUser.email } }
    );

    // Login to get tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    accessToken = loginResponse.body.data.accessToken;
    refreshToken = loginResponse.body.data.refreshToken;
  });

  test('should refresh token successfully', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.accessToken).not.toBe(accessToken);
  });

  test('should fail with invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTH_REFRESH_TOKEN_INVALID');
  });

  test('should logout successfully', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);

    // Token should be invalid after logout
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
```

## File Upload Tests

```javascript
describe('File Upload System', () => {
  let accessToken, testUser;

  beforeEach(async () => {
    // Setup authenticated user
    testUser = await createVerifiedUser('fileuser@example.com');
    accessToken = await getAccessToken(testUser.email, 'SecurePass123!');
  });

  test('should upload PDF file successfully', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n173\n%%EOF');

    const response = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('document', pdfBuffer, 'test.pdf')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.file).toBeDefined();
    expect(response.body.data.file.mime_type).toBe('application/pdf');
    expect(response.body.data.file.processing_status).toBe('pending');
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/files/upload')
      .attach('document', Buffer.from('test'), 'test.pdf')
      .expect(401);

    expect(response.body.error).toContain('No token provided');
  });

  test('should fail with invalid file type', async () => {
    const response = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('document', Buffer.from('malicious content'), 'test.exe')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('file type');
  });

  test('should fail with file too large', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const response = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('document', largeBuffer, 'large.pdf')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('too large');
  });

  test('should enforce upload rate limiting', async () => {
    const pdfBuffer = Buffer.from('simple pdf content');

    // Upload files quickly to hit rate limit
    const promises = [];
    for (let i = 0; i < 12; i++) {
      promises.push(
        request(app)
          .post('/api/files/upload')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('document', pdfBuffer, `test${i}.pdf`)
      );
    }

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Performance Tests

```javascript
describe('Performance Tests', () => {
  let accessToken;

  beforeEach(async () => {
    const testUser = await createVerifiedUser('perf@example.com');
    accessToken = await getAccessToken(testUser.email, 'SecurePass123!');
  });

  test('should handle concurrent requests', async () => {
    const promises = [];
    const startTime = Date.now();

    // Make 50 concurrent requests
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${accessToken}`)
      );
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Should complete within reasonable time
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // 5 seconds
  });

  test('should handle database stress', async () => {
    const { User } = require('../src/models');
    
    // Create many users quickly
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        username: `stressuser${i}`,
        email: `stress${i}@example.com`,
        password: 'hashed-password',
        firstName: 'Stress',
        lastName: 'User',
        is_verified: true
      });
    }

    const startTime = Date.now();
    await User.bulkCreate(users);
    const endTime = Date.now();

    const creationTime = endTime - startTime;
    expect(creationTime).toBeLessThan(2000); // 2 seconds

    // Verify users were created
    const userCount = await User.count();
    expect(userCount).toBeGreaterThanOrEqual(100);
  });
});
```

## Integration Tests

```javascript
describe('Full Workflow Integration', () => {
  test('complete user journey', async () => {
    // 1. Register user
    const userData = {
      username: 'journey',
      email: 'journey@example.com',
      password: 'SecurePass123!',
      firstName: 'Journey',
      lastName: 'User'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(registerResponse.body.success).toBe(true);

    // 2. Verify email (mock)
    const { User } = require('../src/models');
    await User.update(
      { is_verified: true },
      { where: { email: userData.email } }
    );

    // 3. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    const { accessToken } = loginResponse.body.data;

    // 4. Update profile
    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bio: 'Integration test user',
        location: 'Test City'
      })
      .expect(200);

    // 5. Upload file
    const pdfBuffer = Buffer.from('test pdf content');
    const uploadResponse = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('document', pdfBuffer, 'test.pdf')
      .expect(200);

    const fileId = uploadResponse.body.data.file.id;

    // 6. Get files
    const filesResponse = await request(app)
      .get('/api/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(filesResponse.body.data.documents.length).toBeGreaterThan(0);

    // 7. Download file
    await request(app)
      .get(`/api/files/${fileId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 8. Delete file
    await request(app)
      .delete(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 9. Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 10. Verify token is invalid after logout
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
```

## Test Utilities

```javascript
// test/helpers.js
const request = require('supertest');
const app = require('../src/app');

async function createVerifiedUser(email, password = 'SecurePass123!') {
  const userData = {
    username: email.split('@')[0],
    email,
    password,
    firstName: 'Test',
    lastName: 'User'
  };

  await request(app)
    .post('/api/auth/register')
    .send(userData);

  const { User } = require('../src/models');
  await User.update(
    { is_verified: true },
    { where: { email } }
  );

  return userData;
}

async function getAccessToken(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.body.data.accessToken;
}

module.exports = {
  createVerifiedUser,
  getAccessToken
};
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run integration tests only
npm test -- --testNamePattern="Integration"

# Run performance tests
npm run test:performance
```

## Test Coverage Goals

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All major workflows
- **Performance Tests**: Response times under 500ms
- **Security Tests**: All authentication and authorization flows
- **Error Handling**: All error conditions covered

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:api
      - run: npm run test:load
```