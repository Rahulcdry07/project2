// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Password Reset Tests
 * Tests for forgot password and reset functionality
 */
test.describe('Password Reset', () => {
  let testUser;

  test.beforeEach(async ({ page }) => {
    // Create and verify unique test user
    const timestamp = Math.floor(Date.now() * Math.random());
    testUser = {
      username: `resetuser${timestamp}`,
      email: `reset${timestamp}@example.com`,
      password: 'OldPassword123!',
    };

    await page.request.post('http://localhost:3000/api/auth/register', { data: testUser });
    await page.request.post('http://localhost:3000/api/test/verify-user', {
      data: { email: testUser.email },
    });
  });

  test('should request password reset', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/auth/forgot-password', {
      data: { email: testUser.email },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset');
  });

  test('should handle non-existent email for password reset', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/auth/forgot-password', {
      data: { email: 'nonexistent@example.com' },
    });

    // Should still return success for security (don't reveal if email exists)
    expect(response.ok()).toBeTruthy();
  });

  test('should reset password with valid token', async ({ page }) => {
    // Request reset
    await page.request.post('http://localhost:3000/api/auth/forgot-password', {
      data: { email: testUser.email },
    });

    // Get reset token from test endpoint
    const tokenResponse = await page.request.post(
      'http://localhost:3000/api/test/get-reset-token',
      {
        data: { email: testUser.email },
      }
    );
    const tokenData = await tokenResponse.json();
    const resetToken = tokenData.resetToken;

    // Reset password
    const resetResponse = await page.request.post('http://localhost:3000/api/auth/reset-password', {
      data: {
        token: resetToken,
        password: 'NewPassword123!',
      },
    });

    expect(resetResponse.ok()).toBeTruthy();

    // Verify can login with new password
    const loginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email: testUser.email, password: 'NewPassword123!' },
    });

    expect(loginResponse.ok()).toBeTruthy();
  });

  test('should reject invalid reset token', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/auth/reset-password', {
      data: {
        token: 'invalid-token',
        password: 'NewPassword123!',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should display forgot password form', async ({ page }) => {
    // Navigate to static HTML file served by backend on port 3000
    await page.goto('http://localhost:3000/forgot-password.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // HTML uses id="email" not name="email"
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Forgot Your Password');
  });

  test('should display reset password form with token', async ({ page }) => {
    // Navigate to static HTML file served by backend on port 3000
    await page.goto('http://localhost:3000/reset-password.html?token=test-token');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // HTML uses id="password" not name="password"
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirm-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Reset Your Password');
  });
});
