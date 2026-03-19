// Import needed for module extension
import 'vitest'

interface CustomMatchers<R = unknown> {
  toSchemaEqual: (expected: unknown) => R
}

declare module 'vitest' {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
