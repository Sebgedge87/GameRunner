const { test, expect } = require('@playwright/test');
const { apiPost, apiPut } = require('./helpers');

let gmToken, campaignId;

test.beforeAll(async () => {
  // Set up test data via API
  const reg = await apiPost('/api/auth/register', { username: 'e2e-gm2', password: 'password123', character_name: 'GM Hero' });
  const login = await apiPost('/api/auth/login', { username: 'e2e-gm2', password: 'password123' });
  gmToken = login.token;

  const campData = await apiPost('/api/campaigns', { name: 'E2E Test Campaign', system: 'dnd5e' }, gmToken);
  campaignId = campData.campaign?.id;
  if (campaignId) {
    await apiPut(`/api/campaigns/${campaignId}/activate`, {}, gmToken);
  }
});

test.describe('Campaign', () => {
  test('authenticated GM sees campaign on dashboard', async ({ page }) => {
    // Inject the token into localStorage before navigating
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, gmToken);
    await page.reload();

    // Should show campaign name or dashboard content
    await expect(page.locator('body')).not.toContainText('Login', { timeout: 8000 });
  });

  test('campaign switcher shows the campaign', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((token) => localStorage.setItem('token', token), gmToken);
    await page.reload();

    // Wait for the app to load campaigns
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText('E2E Test Campaign', { timeout: 8000 });
  });
});
