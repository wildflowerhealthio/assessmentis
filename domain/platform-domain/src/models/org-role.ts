import { Schema } from 'effect'

import { OrgSlug, Role } from './id-types'

/** A user's set of {@link Role}s within a specific organization. */
export const OrgRole = Schema.Struct({
  orgSlug: OrgSlug,
  roles: Schema.Array(Role),
})
export type OrgRole = typeof OrgRole.Type
