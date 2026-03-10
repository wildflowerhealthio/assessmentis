// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import baseConfig from '@assessmentis/eslint-config'

import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import storybook from 'eslint-plugin-storybook'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  ...storybook.configs['flat/recommended'],
  importPlugin.flatConfigs.react,
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
