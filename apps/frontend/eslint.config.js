// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import { defineConfig } from 'eslint/config'
import baseConfig from '@assessmentis/eslint-config'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  ...baseConfig,
  ...storybook.configs['flat/recommended'],
  {
    ignores: [],
    // extends: [baseConfig],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
])
