import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test'

export const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // Retries are now handled by GitHub Actions
  workers: process.env.CI ? 2 : 4, // Allow parallel execution within shards
  reporter: process.env.CI
    ? [['html'], ['list'], ['github'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html'], ['list'], ['dot']],
  // Support sharding from CLI
  shard: process.env.CI && process.env.SHARD ? {
    current: parseInt(process.env.SHARD.split('/')[0]),
    total: parseInt(process.env.SHARD.split('/')[1])
  } : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    testIdAttribute: 'data-testid',
    viewport: { width: 1920, height: 1080 },
  },

  testIgnore: '**/release/**',

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    ...(process.env.CI
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } } },
          { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } } },
        ]),
  ],
}

export default defineConfig(config)
