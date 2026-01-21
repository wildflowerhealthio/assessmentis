const { defineConfig } = require("eslint/config");
const baseConfig = require("@assessmentis/eslint-config");
const tsParser = require("@typescript-eslint/parser");

module.exports = defineConfig([
  ...baseConfig,
  {
    ignores: ["./eslint.config.cjs"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
]);
