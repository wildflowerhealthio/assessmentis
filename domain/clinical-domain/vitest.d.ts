// Import needed for module extension
// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import 'vitest'

interface CustomMatchers<R = unknown> {
  toSchemaEqual: (expected: unknown) => R
}

declare module 'vitest' {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
