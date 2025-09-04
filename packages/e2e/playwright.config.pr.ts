import { defineConfig } from '@playwright/test'
import { config } from './playwright.config'

export default defineConfig({
  ...config,
  globalSetup: './scripts/pr-global-setup.ts',
  globalTeardown: './scripts/global-teardown.ts',
  // Override settings for PR tests
  fullyParallel: true,
  workers: 2, // Allow parallel execution within shards
  retries: 0, // Retries handled by GitHub Actions
  // Support sharding from CLI arguments
  shard: process.env.CI && process.argv.includes('--shard') ? undefined : config.shard,
})
