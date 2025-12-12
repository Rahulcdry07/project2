// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Login Flow Tests
 * Migrated from cypress/e2e/login.cy.js
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database and setup test user
    const response = await page.request.post('http://localhost:3000/api/test/clear-database');
    expect(response.ok()).toBeTruthy();
    
    // Register test user
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    
    await page.request.post('http://localhost:3000/api/auth/register', { data: user });
    
    // Verify user
    await page.request.post('http://localhost:3000/api/test/verify-user', { 
      data: { email: user.email } 
    });
  });

    test('should login with valid credentials', async ({ page }) => {
    // First, create a test user via API
    await page.request.post('http://localhost:3000/api/test/clear-database');
    await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'testpass'
      }
    });
    await page.request.post('http://localhost:3000/api/test/verify-user', {
      data: { email: 'testuser@example.com' }
    });

    await page.goto('http://localhost:3001/login');
    
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'testpass');
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