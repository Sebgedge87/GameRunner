const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('shows login page on first load', async ({ page }) => {
    await page.goto('/');
    // The app redirects to login when not authenticated
    await expect(page.locator('#login-page, #page-login, .auth-form')).toBeVisible({ timeout: 8000 });
  });

  test('GM can register and land on the dashboard', async ({ page }) => {
    await page.goto('/');
    // Fill registration form — first user auto-becomes available
    const usernameField = page.locator('input[placeholder*="sername"], input[name="username"], #reg-username');
    const passwordField = page.locator('input[type="password"]').first();

    await usernameField.fill('e2e-gm');
    await passwordField.fill('password123');
    await page.locator('button:has-text("Register"), button:has-text("Sign up")').first().click();

    // After registration/login, should reach a dashboard or campaign page
    await expect(page).toHaveURL(/^(?!.*login)/, { timeout: 10000 });
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/');
    const usernameField = page.locator('input[placeholder*="sername"], input[name="username"], #login-username').first();
    const passwordField = page.locator('input[type="password"]').first();

    await usernameField.fill('nobody');
    await passwordField.fill('wrongpass');

    // Try to find and click login button (not register)
    const loginBtn = page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
    await loginBtn.click();

    await expect(page.locator('.toast, .error, [role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});
