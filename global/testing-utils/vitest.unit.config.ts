import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeUnit } from './src/vitest-configs.js'

export default defineConfig((_configEnv) =>
  mergeConfig(nodeUnit(_configEnv), {
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/*.test.ts'],
    },
  })
)
