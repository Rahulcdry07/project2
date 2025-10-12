// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Basic smoke test to verify Playwright setup
 */
test.describe('Smoke Tests', () => {
  test('backend server is running', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('frontend loads correctly', async ({ page }) => {
    await page.goto('/');
    // React app has default title "React App"
    await expect(page).toHaveTitle(/React App|SecureReg|Dynamic Web App|Dashboard/);
    // Should have some basic UI elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});