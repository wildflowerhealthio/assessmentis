import { Schema } from 'effect'
import { CurrentUserError } from './User'
import { OrgSlug, Role } from './IdTypes'

export const OrgRole = Schema.Struct({
  orgSlug: OrgSlug,
  roles: Schema.Array(Role),
})
export type OrgRole = typeof OrgRole.Type

export const OrgRoleError = Schema.Union(CurrentUserError)
export type OrgRoleError = typeof OrgRoleError.Type
