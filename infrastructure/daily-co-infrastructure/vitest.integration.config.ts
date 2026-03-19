import { nodeIntegration } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((configEnv) =>
  mergeConfig(nodeIntegration(configEnv), {
    env: {
      VITE_RECORD: 'true',
    },
    test: {
      name: 'daily-co-infrastructure:integration',
    },
  })
)
