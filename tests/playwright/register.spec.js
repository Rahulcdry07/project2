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
    
    // Fill registration form including confirm password
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Wait for validation to complete and button to be enabled
    await page.waitForTimeout(500);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForTimeout(3000);
    
    // Should redirect to login page after successful registration
    expect(page.url()).toContain('/login');
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Register first user
    const user = {
      username: 'firstuser',
      email: 'duplicate@example.com',
      password: 'password123'
    };
    
    await page.request.post('http://localhost:3000/api/auth/register', { data: user });
    
    // Try to register with same email (THIS IS THE KEY - use the SAME email)
    await page.goto('/register');
    await page.fill('input[name="username"]', 'anotheruser');
    await page.fill('input[name="email"]', 'duplicate@example.com'); // Same email as above!
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Wait for validation
    await page.waitForTimeout(500);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    await page.click('button[type="submit"]');
    
    // Wait for error to appear
    await page.waitForTimeout(2000);
    
    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('should show error for duplicate username', async ({ page }) => {
    // Register first user
    const user = {
      username: 'duplicateuser',
      email: 'first@example.com',
      password: 'password123'
    };
    
    await page.request.post('http://localhost:3000/api/auth/register', { data: user });
    
    // Try to register with same username (THIS IS THE KEY - use the SAME username)
    await page.goto('/register');
    await page.fill('input[name="username"]', 'duplicateuser'); // Same username as above!
    await page.fill('input[name="email"]', 'different@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Wait for validation
    await page.waitForTimeout(500);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    await page.click('button[type="submit"]');
    
    // Wait for error to appear
    await page.waitForTimeout(2000);
    
    // Should show error message - could be alert or toast
    const hasAlert = await page.locator('.alert-danger').isVisible();
    const hasToast = await page.locator('.toast-error, [class*="toast"][class*="error"]').isVisible();
    expect(hasAlert || hasToast).toBeTruthy();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/register');
    
    // Try with short password
    await page.fill('input[name="username"]', 'shortpass');
    await page.fill('input[name="email"]', 'short@example.com');
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

  test('should redirect to login after successful registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="username"]', 'redirectuser');
    await page.fill('input[name="email"]', 'redirect@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Wait for validation and button to be enabled
    await page.waitForTimeout(500);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    
    // Wait for redirect to complete
    await page.waitForTimeout(3000);
    
    // Should be redirected to login page
    expect(page.url()).toContain('/login');
  });
});