import { assert, expect } from 'vitest'

export const expectDataEqual = <T extends object>(
  actual: T,
  expected: T
): void => {
  // try {
  assert.deepEqual(actual, expected)
  // expect(Equal.equals(Data.struct(actual), Data.struct(expected))).toBe(true)
  // } catch (cause) {
  //   throw new Error(
  //     `${cause instanceof Error ? cause.message : String(cause)}\nActual: ${JSON.stringify(
  //       actual,
  //       (k, v) => (v === undefined ? 'UNDEFINED' : v),
  //       2
  //     )}\nExpected: ${JSON.stringify(expected, (k, v) => (v === undefined ? 'UNDEFINED' : v), 2)}`,
  //     { cause }
  //   )
  // }
}
