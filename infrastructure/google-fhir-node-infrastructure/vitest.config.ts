import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup/test-config.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run sequentially to avoid rate limiting
    maxWorkers: 1,
  },
})
