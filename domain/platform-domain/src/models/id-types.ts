import { Schema } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

// Keys that can cause prototype pollution and should be filtered in tests
const DANGEROUS_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'] as const

/**
 * Branded string identifying an organization by its URL-safe slug.
 *
 * @remarks
 * Restricted to lowercase alphanumerics and hyphens (`[a-z0-9][a-z0-9-]*`)
 * so that slugs are safe in URL path segments without percent-encoding.
 * The custom `arbitrary` annotation generates matching short strings and
 * filters out prototype-pollution keys so property tests stay safe.
 */
export const OrgSlug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9][a-z0-9-]*$/),
  Schema.brand('OrgSlug')
).annotations({
  arbitrary: (): Arbitrary.LazyArbitrary<typeof OrgSlug.Type> => (fc: typeof FastCheck) =>
    fc
      .string({
        maxLength: 10,
        minLength: 3,
        unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
      })
      .filter((s) => /^[a-z0-9][a-z0-9-]*$/.test(s))
      .filter((s) => !DANGEROUS_KEYS.includes(s))
      .map((s) => OrgSlug.make(s)),
})
export type OrgSlug = typeof OrgSlug.Type

/** Branded string representing a permission role within an organization. */
export const Role = Schema.String.pipe(Schema.brand('Role'))
export type Role = typeof Role.Type
