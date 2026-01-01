// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * API Tests
 * Migrated from cypress/e2e/api_tests.cy.js
 */
test.describe('API Tests', () => {
  test.beforeEach(async ({ page }) => {
    // No database clearing - tests use unique users
  });

  test.describe('Authentication API', () => {
    test('should register a new user', async ({ page }) => {
      const timestamp = Math.floor(Date.now() * Math.random());
      const user = {
        username: `apiuser${timestamp}`,
        email: `api${timestamp}@example.com`,
        password: 'password123',
      };

      const response = await page.request.post('http://localhost:3000/api/auth/register', {
        data: user,
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Registration successful');
    });

    test('should login with valid credentials', async ({ page }) => {
      // Register and verify user first
      const timestamp = Math.floor(Date.now() * Math.random());
      const user = {
        username: `loginuser${timestamp}`,
        email: `login${timestamp}@example.com`,
        password: 'password123',
      };

      await page.request.post('http://localhost:3000/api/auth/register', { data: user });
      await page.request.post('http://localhost:3000/api/test/verify-user', {
        data: { email: user.email },
      });

      // Test login
      const response = await page.request.post('http://localhost:3000/api/auth/login', {
        data: { email: user.email, password: user.password },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
      expect(data.data.user.email).toBe(user.email);
    });

    test('should reject invalid login credentials', async ({ page }) => {
      const response = await page.request.post('http://localhost:3000/api/auth/login', {
        data: { email: 'nonexistent@example.com', password: 'wrongpassword' },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should verify email with valid token', async ({ page }) => {
      // Register user
      const timestamp = Math.floor(Date.now() * Math.random());
      const user = {
        username: `verifyuser${timestamp}`,
        email: `verify${timestamp}@example.com`,
        password: 'password123',
      };

      await page.request.post('http://localhost:3000/api/auth/register', { data: user });

      // Use test endpoint to verify user (simulates email verification)
      const verifyResponse = await page.request.post('http://localhost:3000/api/test/verify-user', {
        data: { email: user.email },
      });

      expect(verifyResponse.ok()).toBeTruthy();
      const verifyData = await verifyResponse.json();
      expect(verifyData.message).toContain('verified');
    });
  });

  test.describe('Protected Routes', () => {
    /**
     * @type {any}
     */
    let authToken;
    let testUser;

    test.beforeEach(async ({ page }) => {
      // Setup authenticated user
      const timestamp = Math.floor(Date.now() * Math.random());
      testUser = {
        username: `protecteduser${timestamp}`,
        email: `protected${timestamp}@example.com`,
        password: 'password123',
      };

      await page.request.post('http://localhost:3000/api/auth/register', { data: testUser });
      await page.request.post('http://localhost:3000/api/test/verify-user', {
        data: { email: testUser.email },
      });

      const loginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
        data: { email: testUser.email, password: testUser.password },
      });

      if (!loginResponse.ok()) {
        const errorData = await loginResponse.json();
        throw new Error(`Login failed: ${JSON.stringify(errorData)}`);
      }

      const loginData = await loginResponse.json();
      if (!loginData.data || !loginData.data.token) {
        throw new Error(`Invalid login response: ${JSON.stringify(loginData)}`);
      }

      authToken = loginData.data.token;
    });

    test('should access profile with valid token', async ({ page }) => {
      const response = await page.request.get('http://localhost:3000/api/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok()) {
        const errorData = await response.json();
        console.log('Profile request failed:', response.status(), errorData);
      }

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      // Profile endpoint returns direct user data
      expect(data).toBeTruthy();
      expect(data.email || data.username).toBeTruthy();
    });

    test('should reject requests without token', async ({ page }) => {
      const response = await page.request.get('http://localhost:3000/api/profile');

      expect(response.status()).toBe(401);
    });

    test('should reject requests with invalid token', async ({ page }) => {
      const response = await page.request.get('http://localhost:3000/api/profile', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Health Check', () => {
    test('should return healthy status', async ({ page }) => {
      const response = await page.request.get('http://localhost:3000/api/health');

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      // Backend returns "ok" not "healthy"
      expect(data.status).toBe('ok');
    });
  });
});
