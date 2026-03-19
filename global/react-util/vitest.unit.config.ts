import { jsdomUnit } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

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
