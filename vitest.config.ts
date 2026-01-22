import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'apps/*/vitest.config.ts',
      'domain/*/vitest.config.ts',
      'global/*/vitest.config.ts',
      'infrastructure/*/vitest.config.ts',
    ],
  },
})
