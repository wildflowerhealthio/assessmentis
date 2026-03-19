import { Schema } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

// Keys that can cause prototype pollution and should be filtered in tests
const DANGEROUS_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'] as const

/**
 * Branded string identifying an organization by its URL-safe slug.
 *
 * @remarks
 * The custom `arbitrary` annotation generates short ASCII strings (3–10 chars)
 * and filters out prototype-pollution keys so property tests stay safe.
 */
export const OrgSlug = Schema.String.pipe(Schema.brand('OrgSlug')).annotations({
  arbitrary: (): Arbitrary.LazyArbitrary<typeof OrgSlug.Type> => (fc: typeof FastCheck) =>
    fc
      .string({
        maxLength: 10,
        minLength: 3,
        unit: 'grapheme-ascii',
      })
      .filter((s) => !DANGEROUS_KEYS.includes(s))
      .map((s) => OrgSlug.make(s)),
})
export type OrgSlug = typeof OrgSlug.Type

/** Branded string representing a permission role within an organization. */
export const Role = Schema.String.pipe(Schema.brand('Role'))
export type Role = typeof Role.Type
