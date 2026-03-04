const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    // Node.js / Browser builtins
    '<BUILTIN_MODULES>',
    'fast-check',
    '^vitest(/.*)?$',
    // Framework: Effect, React, TanStack, Firebase
    '^effect(/.*)?$',
    '^@effect/',
    'express',
    '^react(/.*)?$',
    '^react-dom(/.*)?$',
    '^react-router(/.*)?$',
    '^@react-router/',
    '^firebase-functions',
    '',
    '^@assessmentis/',
    '',
    // Other external dependencies
    '<THIRD_PARTY_MODULES>',
    '',
    // Relative imports (within a package)
    '^[.]',
  ],
  importOrderTypeScriptVersion: '5.7.3',
}

export default config
