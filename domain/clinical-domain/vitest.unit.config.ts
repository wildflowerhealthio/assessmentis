import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { nodeUnit } from '@assessmentis/testing-utils/vitest-configs'
import { defineConfig, mergeConfig } from 'vitest/config'

export default defineConfig((configEnv) =>
  mergeConfig(
    nodeUnit(configEnv),
    defineConfig({
      test: {
        name: 'clinical-domain:unit',
        setupFiles: [
          path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            '/../../global/testing-utils/src/vitest-global.setup.ts'
          ),
          path.join(path.dirname(fileURLToPath(import.meta.url)), '/vitest.setupSchemaEqual.ts'),
        ],
      },
    })
  )
)
