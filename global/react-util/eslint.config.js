import baseConfig from '@assessmentis/eslint-config'

import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  importPlugin.flatConfigs.react,
  {
    ignores: ['eslint.config.cjs'],
    // extends: [baseConfig],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
])
