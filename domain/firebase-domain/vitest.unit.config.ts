import { nodeUnit } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((configEnv) =>
  mergeConfig(
    nodeUnit(configEnv),
    defineConfig({
      test: {
        name: 'firebase-domain:unit',
      },
    })
  )
)
