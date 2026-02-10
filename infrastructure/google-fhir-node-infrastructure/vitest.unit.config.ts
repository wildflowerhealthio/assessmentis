import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeUnit } from '@assessmentis/testing-utils/vitest-configs'

export default defineConfig((configEnv) =>
  mergeConfig(nodeUnit(configEnv), {
    test: {
      name: 'google-fhir-node-infrastructure:unit',
      // Integration tests without
      include: ['test/**/*integration.test.ts'],
    },
  })
)
