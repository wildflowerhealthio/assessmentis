import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeIntegration } from '@assessmentis/testing-utils/vitest-configs'

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
