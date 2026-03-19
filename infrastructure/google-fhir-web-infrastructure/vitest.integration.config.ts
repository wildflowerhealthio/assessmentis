import { browserIntegration } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((_configEnv) =>
  mergeConfig(browserIntegration(_configEnv), {
    env: {
      VITE_RECORD: 'true',
    },
    test: {
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
      name: 'google-fhir-web-infrastructure:integration',
    },
  })
)
