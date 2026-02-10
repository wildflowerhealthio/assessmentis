import { defineConfig, mergeConfig } from 'vitest/config'
import { jsdomUnit } from '@assessmentis/testing-utils/vitest-configs'

export default defineConfig((configEnv) =>
  mergeConfig(
    jsdomUnit(configEnv),
    defineConfig({
      test: {
        name: 'react-util:unit',
      },
    })
  )
)
