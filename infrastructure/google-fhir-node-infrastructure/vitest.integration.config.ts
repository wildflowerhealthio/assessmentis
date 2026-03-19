import { nodeIntegration } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((_configEnv) =>
  mergeConfig(nodeIntegration(_configEnv), {
    env: {
      VITE_RECORD: 'true',
    },
    test: {
      name: 'google-fhir-node-infrastructure:integration',
    },
  })
)
