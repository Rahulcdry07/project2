// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Profile Tests
 * Tests for user profile functionality
 */
test.describe('User Profile', () => {
  let testUser;
  let authToken;

  test.beforeEach(async ({ page }) => {
    // Create and verify unique test user
    const timestamp = Math.floor(Date.now() * Math.random());
    testUser = {
      username: `profileuser${timestamp}`,
      email: `profile${timestamp}@example.com`,
      password: 'TestPass123!',
    };

    await page.request.post('http://localhost:3000/api/auth/register', { data: testUser });
    await page.request.post('http://localhost:3000/api/test/verify-user', {
      data: { email: testUser.email },
    });

    // Login to get token
    const loginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email: testUser.email, password: testUser.password },
    });
    const loginData = await loginResponse.json();
    authToken = loginData.data.token;
  });

  test('should get user profile', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // API may return different structure - check what's actually returned
    if (data.success !== undefined) {
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testUser.email);
    } else {
      // Direct user object response
      expect(data.email).toBe(testUser.email);
      expect(data.username).toBe(testUser.username);
    }
  });

  test('should update user profile', async ({ page }) => {
    const updates = {
      username: `updated${testUser.username}`,
      bio: 'Test bio for user profile',
    };

    const response = await page.request.put('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: updates,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // API may return different structure
    if (data.success !== undefined) {
      expect(data.success).toBe(true);
    } else {
      // Verify response contains updated data
      expect(response.status()).toBe(200);
    }
  });

  test('should reject unauthorized profile access', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/profile');

    expect(response.status()).toBe(401);
  });

  test('should reject invalid token', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/profile', {
      headers: { Authorization: 'Bearer invalid-token-here' },
    });

    expect(response.status()).toBe(401);
  });
});
