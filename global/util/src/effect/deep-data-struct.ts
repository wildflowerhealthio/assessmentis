import { Data } from 'effect'
import type { Equal } from 'effect'

/**
 * The result of deeply wrapping a value for structural equality.
 *
 * - Plain objects become `Data.struct` (gaining `Equal` + `Hash`)
 *   with every property recursively wrapped.
 * - Arrays become `Data.array` with elements recursively wrapped.
 * - Primitives pass through unchanged.
 */
export type DeepData<T> = T extends readonly (infer E)[]
  ? readonly DeepData<E>[] & Equal.Equal
  : T extends Record<string, unknown>
    ? { readonly [P in keyof T]: DeepData<T[P]> } & Equal.Equal
    : T

/**
 * Recursively wraps a plain object in `Data.struct` so that `Equal.equals`
 * performs deep structural comparison. Nested plain objects are wrapped
 * recursively, and arrays are wrapped with `Data.array` (with plain-object
 * elements also recursively wrapped).
 *
 * @example
 * ```ts
 * const a = deepDataStruct({ tag: 'x', nested: { flag: true } })
 * const b = deepDataStruct({ tag: 'x', nested: { flag: true } })
 * Equal.equals(a, b) // true
 *
 * const c = deepDataStruct({ items: [1, 2, 3] })
 * const d = deepDataStruct({ items: [1, 2, 3] })
 * Equal.equals(c, d) // true
 * ```
 */
export const deepDataStruct = <T extends Record<string, unknown>>(obj: T): DeepData<T> => {
  const wrapped: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    wrapped[key] = deepWrapValue(obj[key])
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return Data.struct(wrapped as T) as DeepData<T>
}

/** Recursively wrap a single value — dispatches to `deepDataStruct` for objects and `Data.array` for arrays. */
const deepWrapValue = (value: unknown): unknown => {
  if (isPlainObject(value)) {
    return deepDataStruct(value)
  }
  if (Array.isArray(value)) {
    return Data.array(value.map((item) => deepWrapValue(item)))
  }
  return value
}

/** Returns true for plain `{}` objects (not arrays, null, or class instances). */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
