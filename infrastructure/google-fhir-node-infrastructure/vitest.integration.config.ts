import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeIntegration } from '@assessmentis/testing-utils/vitest-configs'

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
