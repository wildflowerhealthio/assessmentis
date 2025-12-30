import { defineConfig } from 'eslint/config'
import baseConfig from '@assessmentis/eslint-config'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  ...baseConfig,
  {
    ignores: ['./eslint.config.ts', './cdk.out/**', './dist/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
])
