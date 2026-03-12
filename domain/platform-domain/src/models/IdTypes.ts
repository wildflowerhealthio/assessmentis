import { Schema } from 'effect'

// Keys that can cause prototype pollution and should be filtered in tests
const DANGEROUS_KEYS: ReadonlyArray<string> = [
  '__proto__',
  'constructor',
  'prototype',
] as const

/**
 * Branded string identifying an organization by its URL-safe slug.
 *
 * @remarks
 * The custom `arbitrary` annotation generates short ASCII strings (3–10 chars)
 * and filters out prototype-pollution keys so property tests stay safe.
 */
export const OrgSlug = Schema.String.pipe(Schema.brand('OrgSlug')).annotations({
  arbitrary: () => (fc) =>
    fc
      .string({
        unit: 'grapheme-ascii',
        minLength: 3,
        maxLength: 10,
      })
      .filter((s) => !DANGEROUS_KEYS.includes(s))
      .map(OrgSlug.make),
})
export type OrgSlug = typeof OrgSlug.Type

/** Branded string representing a permission role within an organization. */
export const Role = Schema.String.pipe(Schema.brand('Role'))
export type Role = typeof Role.Type
