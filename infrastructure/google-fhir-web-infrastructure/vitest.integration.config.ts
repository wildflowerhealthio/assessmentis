import { defineConfig, mergeConfig } from 'vitest/config'
import { browserIntegration } from '@assessmentis/testing-utils/vitest-configs'

export default defineConfig((_configEnv) =>
  mergeConfig(browserIntegration(_configEnv), {
    env: {
      VITE_RECORD: 'true',
    },
    test: {
      name: 'google-fhir-web-infrastructure:integration',
      browser: {
        orchestratorScripts: [
          {
            src: 'test/helpers/orchestratorScripts.ts',
          },
        ],
      },
      env: {
        VITE_RECORD: 'true',
      },
    },
  })
)
