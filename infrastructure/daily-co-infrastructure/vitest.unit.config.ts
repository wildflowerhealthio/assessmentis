import { nodeUnit } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((configEnv) =>
  mergeConfig(nodeUnit(configEnv), {
    test: {
      name: 'daily-co-infrastructure:unit',
      // Integration tests without
      include: ['test/**/*integration.test.ts'],
    },
  })
)
