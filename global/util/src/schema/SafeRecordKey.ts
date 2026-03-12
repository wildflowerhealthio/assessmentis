import type { Arbitrary } from 'effect'
import { Schema } from 'effect'

/**
 * Keys that can cause prototype pollution or collide with built-in
 * `Object.prototype` methods when used as record keys.
 */
export const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'hasOwnProperty',
  'toString',
  'valueOf',
])

/**
 * A filtered `Schema.String` that rejects JS-special keys (`__proto__`,
 * `constructor`, `prototype`, `hasOwnProperty`, `toString`, `valueOf`).
 *
 * Use as the `key` schema in `Schema.Record` whenever the key space is
 * user-defined and unbounded.
 */
export const SafeRecordKey: Schema.filter<
  Schema.Schema<string, string, never>
> = Schema.String.pipe(
  Schema.filter((key) => !DANGEROUS_KEYS.has(key), {
    message: (issue) =>
      `Key "${issue.actual}" is used as an internal property name and cannot be used here`,
  })
).annotations({
  arbitrary: (): Arbitrary.LazyArbitrary<string> => (fc) =>
    fc.string().filter((s) => !DANGEROUS_KEYS.has(s)),
})
