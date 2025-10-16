import { defineConfig, devices } from '@playwright/test'
import { config } from './playwright.config'

const isWindows = process.platform === 'win32'
const isWindowsFastMode = process.env.MOTIA_WINDOWS_FAST_MODE === 'true'

export default defineConfig({
  ...config,
  globalSetup: './scripts/global-setup.ts',
  globalTeardown: './scripts/global-teardown.ts',
  fullyParallel: true,
  workers: isWindows ? 1 : 2,
  retries: 0,
  timeout: isWindowsFastMode ? 45000 : 60000,
  expect: {
    timeout: isWindowsFastMode ? 8000 : 10000,
  },
  use: {
    ...config.use,
    actionTimeout: isWindowsFastMode ? 12000 : 15000,
    navigationTimeout: isWindowsFastMode ? 20000 : 30000,
    video: isWindows ? 'off' : 'retain-on-failure',
    trace: isWindows ? 'off' : 'on-first-retry',
  },
  shard: process.env.CI && process.argv.includes('--shard') ? undefined : config.shard,
})
