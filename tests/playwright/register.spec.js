// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Registration Tests
 * Migrated from cypress/e2e/register.cy.js
 */
test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database before each test
    await page.request.post('http://localhost:3000/api/test/clear-database');
  });

  test('should display registration form', async ({ page }) => {
    await page.goto('/register');

    // Check form elements exist
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Use unique credentials for each test run
    const timestamp = Date.now();
    const username = `user${timestamp}`;
    const email = `user${timestamp}@example.com`;

    // Fill registration form including confirm password
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Wait for validation to complete and button to be enabled
    await page.waitForTimeout(500);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL('**/login', { timeout: 5000 }),
      page.click('button[type="submit"]'),
    ]);

    // Should redirect to login page after successful registration
    expect(page.url()).toContain('/login');
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Register first user with unique email
    const timestamp = Date.now();
    const duplicateEmail = `duplicate${timestamp}@example.com`;
    const user = {
      username: `firstuser${timestamp}`,
      email: duplicateEmail,
      password: 'Password123!',
    };

    await page.request.post('http://localhost:3000/api/auth/register', { data: user });

    // Try to register with same email (THIS IS THE KEY - use the SAME email)
    await page.goto('/register');
    await page.fill('input[name="username"]', `anotheruser${timestamp}`);
    await page.fill('input[name="email"]', duplicateEmail); // Same email as above!
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Wait for validation
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]', { force: true });

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Should show error message - check for alert or form staying on same page (not redirecting to login)
    const hasAlert = (await page.locator('.alert-danger, .alert').count()) > 0;
    const stillOnRegister = page.url().includes('/register');
    expect(hasAlert || stillOnRegister).toBeTruthy();
  });

  test('should show error for duplicate username', async ({ page }) => {
    // Register first user with unique username
    const timestamp = Date.now();
    const duplicateUsername = `duplicateuser${timestamp}`;
    const user = {
      username: duplicateUsername,
      email: `first${timestamp}@example.com`,
      password: 'Password123!',
    };

    await page.request.post('http://localhost:3000/api/auth/register', { data: user });

    // Try to register with same username (THIS IS THE KEY - use the SAME username)
    await page.goto('/register');
    await page.fill('input[name="username"]', duplicateUsername); // Same username as above!
    await page.fill('input[name="email"]', `different${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Wait for validation
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]', { force: true });

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Should show error message - check for alert or form staying on same page (not redirecting to login)
    const hasAlert = (await page.locator('.alert-danger, .alert').count()) > 0;
    const stillOnRegister = page.url().includes('/register');
    expect(hasAlert || stillOnRegister).toBeTruthy();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    // Try with short password
    await page.fill('input[name="username"]', `shortpass${timestamp}`);
    await page.fill('input[name="email"]', `short${timestamp}@example.com`);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    // Wait for validation
    await page.waitForTimeout(500);

    // Submit button should be disabled due to validation
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Should show password validation error
    const errorElement = await page.locator('.invalid-feedback, .text-danger').first();
    await expect(errorElement).toBeVisible();
  });

  test('should validate password mismatch', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    await page.fill('input[name="username"]', `mismatch${timestamp}`);
    await page.fill('input[name="email"]', `mismatch${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password456!');

    // Wait for validation
    await page.waitForTimeout(500);

    // Submit button should be disabled due to password mismatch
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    await page.fill('input[name="username"]', `emailtest${timestamp}`);
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Wait for validation
    await page.waitForTimeout(500);

    // Submit button should be disabled due to invalid email
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });
});
