const { defineConfig } = require('eslint/config')
const eslint = require('@eslint/js')
const importPlugin = require('eslint-plugin-import')
const tseslint = require('typescript-eslint')
const eslintConfigPrettier = require('eslint-config-prettier/flat')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const tsParser = require('@typescript-eslint/parser')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const tsdocPlugin = require('eslint-plugin-tsdoc')

module.exports = defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
      },
    },
    rules: {
      'import/no-unresolved': ['off'],
      '@typescript-eslint/no-namespace': ['off'],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'always' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-refresh/only-export-components': [
        'error',
        {
          allowExportNames: [
            'loader',
            'clientLoader',
            'action',
            'clientAction',
            'ErrorBoundary',
            'HydrateFallback',
            'headers',
            'handle',
            'links',
            'meta',
            'shouldRevalidate',
          ],
        },
      ],
    },
  },
  {
    plugins: { tsdoc: tsdocPlugin },
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'tsdoc/syntax': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
    },
  },
])
