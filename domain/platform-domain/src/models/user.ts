import { Schema, pipe } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Search } from '@assessmentis/effectful-store'
import { makeCloneWith } from '@assessmentis/util'

import { OrgSlug, Role } from './id-types'
import { UserId } from './user-id'

const UserUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('User/url'))

/**
 * User profile document stored in the `users` collection.
 *
 * @remarks
 * Satisfies the `DomainClass` interface from effectful-store. `org_roles`
 * maps each {@link OrgSlug} the user belongs to onto the {@link Role}s they
 * hold in that org. `lastOrg` records the slug of the most recently selected
 * organization for session restoration.
 */
export class User extends Schema.Class<User>('User')({
  /** String literal discriminant identifying this as a User resource. */
  domainType: Schema.optionalWith(Schema.Literal('User'), {
    default: () => 'User' as const,
  }),
  /** Firebase URL identifying this user's location in the store. */
  url: Schema.optional(UserUrlSchema),
  /** Slug of the most recently selected org, for session restoration. */
  lastOrg: Schema.optional(Schema.String),
  /** Maps each org slug to the roles this user holds in that org. */
  org_roles: Schema.Record({
    key: OrgSlug,
    value: Schema.Array(Role),
  }),
  /** Firebase UID identifying the authenticated user. */
  uid: UserId,
}) {
  static readonly DomainType = 'User' as const
  static readonly UrlSchema = UserUrlSchema
  static readonly SearchSchema = {} as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(User, this)
}
