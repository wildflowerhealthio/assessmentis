import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/replay/**/*.replay.test.ts'],
    exclude: ['src/**/*.live.test.ts'],
    setupFiles: ['test/setup/replay.setup.ts'],
  },
})
