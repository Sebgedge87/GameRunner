const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,   // tests share state via the running server
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Start the server before tests and kill it after
  webServer: {
    command: 'NODE_OPTIONS=--experimental-sqlite node server/src/index.js',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    env: {
      PORT: '3000',
      NODE_ENV: 'test',
      REGISTRATION_OPEN: 'true',
      DB_PATH: '/tmp/chronicle-e2e.db',
      VAULT_PATH: '/tmp/chronicle-e2e-vault',
      JWT_SECRET: 'e2e-test-secret',
    },
  },
});
