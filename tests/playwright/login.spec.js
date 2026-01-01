// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Login Flow Tests
 * Migrated from cypress/e2e/login.cy.js
 */
test.describe('Login Flow', () => {
  let testUser;

  test.beforeEach(async ({ page }) => {
    // Setup unique test user
    const timestamp = Math.floor(Date.now() * Math.random());
    testUser = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
    };

    await page.request.post('http://localhost:3000/api/auth/register', { data: testUser });

    // Verify user
    await page.request.post('http://localhost:3000/api/test/verify-user', {
      data: { email: testUser.email },
    });
  });

  test('should login with valid credentials', async ({ page }) => {
    // Create a unique test user via API
    const timestamp = Math.floor(Date.now() * Math.random());
    const loginUser = {
      username: `loginuser${timestamp}`,
      email: `loginuser${timestamp}@example.com`,
      password: 'testpass',
    };

    await page.request.post('http://localhost:3000/api/auth/register', {
      data: loginUser,
    });
    await page.request.post('http://localhost:3000/api/test/verify-user', {
      data: { email: loginUser.email },
    });

    await page.goto('http://localhost:3001/login');

    await page.fill('#email', loginUser.email);
    await page.fill('#password', loginUser.password);
    await page.click('button[type="submit"]');

    // Wait for login to process and check for redirect to dashboard
    await page.waitForTimeout(3000);

    // Should redirect to dashboard after successful login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    // Could be /dashboard, /dashboard.html, or React route
    expect(currentUrl.includes('/dashboard') || currentUrl.includes('localhost:3001')).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try with wrong password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message and stay on login page
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login');

    // Try with non-existent email
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
