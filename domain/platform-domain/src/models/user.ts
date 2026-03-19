import { Schema } from 'effect'

import { OrgSlug, Role } from './id-types'
import { UserId } from './user-id'

/**
 * Schema for a user profile.
 *
 * @remarks
 * `org_roles` maps each {@link OrgSlug} the user belongs to onto the
 * {@link Role}s they hold in that org. `lastOrg` records the slug of the
 * most recently selected organization for session restoration.
 */
export const User = Schema.Struct({
  lastOrg: Schema.optional(Schema.String),
  org_roles: Schema.Record({
    key: OrgSlug,
    value: Schema.Array(Role),
  }),
  uid: UserId,
})
export type User = typeof User.Type
