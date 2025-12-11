import { Schema } from 'effect'

export const OrgSlug = Schema.String.pipe(Schema.brand('OrgSlug'))
export type OrgSlug = typeof OrgSlug.Type

export const Role = Schema.String.pipe(Schema.brand('Role'))
export type Role = typeof Role.Type
