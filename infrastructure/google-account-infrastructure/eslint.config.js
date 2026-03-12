import baseConfig from '@assessmentis/eslint-config'
import tsParser from '@typescript-eslint/parser'

export default [
  ...baseConfig,
  {
    ignores: ['./eslint.config.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
]
