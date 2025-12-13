const { defineConfig } = require("eslint/config");
const eslint = require( '@eslint/js');
const tseslint  = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const tsParser = require("@typescript-eslint/parser");
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh')


module.exports = defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react-refresh/only-export-components": [
        "error",
        {
          allowExportNames: [
              "loader",
              "clientLoader",
              "action",
              "clientAction",
              "ErrorBoundary",
              "HydrateFallback",
              "headers",
              "handle",
              "links",
              "meta",
              "shouldRevalidate",
            ],
        },
      ],
    },
  }
]);
