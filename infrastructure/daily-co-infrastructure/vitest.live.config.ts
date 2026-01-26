import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/live/**/*.live.test.ts'],
    setupFiles: ['test/setup/live.setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run sequentially to avoid rate limiting
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
