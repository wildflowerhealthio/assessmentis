import { defineConfig } from 'eslint/config'
import baseConfig from '@assessmentis/eslint-config'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  ...baseConfig,
  {
    ignores: ['eslint.config.cjs', 'src/vitest-configs.*'],
    languageOptions: {
      globals: {
        node: true,
        process: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
])
