import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for CI/staging environment testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['github']], // GitHub Actions integration
  timeout: 30000, // Standard timeout for staging
  use: {
    baseURL: process.env.BASE_URL || 'https://app-staging-371c.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No global setup/teardown - testing against live staging
  expect: {
    timeout: 5000, // Standard expect timeout
  },
});