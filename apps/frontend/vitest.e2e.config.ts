import { defineConfig, mergeConfig } from 'vitest/config'
import { browserE2e } from '@assessmentis/testing-utils/vitest-configs'

export default defineConfig((configEnv) =>
  mergeConfig(
    browserE2e(configEnv),
    defineConfig({
      test: {
        name: 'frontend:e2e',
      },
    })
  )
)
