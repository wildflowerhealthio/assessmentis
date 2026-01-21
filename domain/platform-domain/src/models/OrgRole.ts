import { Schema } from 'effect'
import { OrgSlug, Role } from './IdTypes'

export const OrgRole = Schema.Struct({
  orgSlug: OrgSlug,
  roles: Schema.Array(Role),
})
export type OrgRole = typeof OrgRole.Type
