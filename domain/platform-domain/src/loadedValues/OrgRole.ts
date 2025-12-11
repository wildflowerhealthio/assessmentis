import { Schema } from 'effect'
import { CurrentUserError } from './User'
import { OrgSlug, Role } from './IdTypes'

export const OrgRole = Schema.Struct({
  orgSlug: OrgSlug,
  roles: Schema.Array(Role),
})
export type OrgRole = typeof OrgRole.Type

export const NoOrgSelected = Schema.TaggedStruct('NoOrgSelected', {})
export type NoOrgSelected = typeof NoOrgSelected.Type

export const OrgRoleError = Schema.Union(CurrentUserError, NoOrgSelected)
export type OrgRoleError = typeof OrgRoleError.Type
