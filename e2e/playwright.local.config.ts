import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for local containerized testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Reduced parallelism for container stability
  forbidOnly: !!process.env.CI,
  retries: 1, // Single retry for local testing
  workers: 2, // Limited workers for container resources
  reporter: [['html'], ['line']], // Console output for local dev
  timeout: 60000, // Increased timeout for container startup
  use: {
    baseURL: 'http://localhost:3000',
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

  // Global setup/teardown for container management
  globalSetup: require.resolve('./scripts/global-setup.ts'),
  globalTeardown: require.resolve('./scripts/global-teardown.ts'),

  // Wait for services to be ready
  expect: {
    timeout: 10000, // Extended expect timeout for containers
  },
});