import { Schema } from 'effect'

// Keys that can cause prototype pollution and should be filtered in tests
const DANGEROUS_KEYS: ReadonlyArray<string> = [
  '__proto__',
  'constructor',
  'prototype',
] as const

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

export const Role = Schema.String.pipe(Schema.brand('Role'))
export type Role = typeof Role.Type
