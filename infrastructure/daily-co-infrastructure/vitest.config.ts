import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    setupFiles: ['test/helpers/test-config.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run sequentially to avoid rate limiting and tape conflicts
    maxWorkers: 1,
  },
})
