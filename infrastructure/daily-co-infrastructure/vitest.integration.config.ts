import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeUnit } from '@assessmentis/testing-utils/vitest-configs'

export default defineConfig((configEnv) =>
  mergeConfig(nodeUnit(configEnv), {
    env: {
      VITE_RECORD: 'true',
    },
    test: {
      name: 'daily-co-infrastructure:integration',
    },
  })
)
