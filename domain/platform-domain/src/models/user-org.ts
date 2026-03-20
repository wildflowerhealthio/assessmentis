import { Data, Equal, Schema, pipe } from 'effect'

import { ReadonlyUrl, UriEncodedOriginUrl } from '@assessmentis/effectful-store'
import type { Search } from '@assessmentis/effectful-store'
import { makeCloneWith } from '@assessmentis/util'

/**
 * Base schema for a per-user origin configuration entry.
 *
 * @remarks
 * Uses `onExcessProperty: 'preserve'` so that origin-specific fields
 * (e.g. OAuth tokens) survive decoding even though only `_tag` is
 * declared here. Concrete origin types narrow this further.
 */
const BaseOriginUserConfig = Schema.Struct({
  _tag: Schema.String,
}).annotations({
  equivalence: (): ((a: { _tag: string }, b: { _tag: string }) => boolean) => (a, b) =>
    a._tag === b._tag && Equal.equals(Data.struct(a), Data.struct(b)),
  parseOptions: { onExcessProperty: 'preserve' },
})

const UserOrgUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('UserOrg/url'))

/**
 * Per-user, per-org configuration stored as a subcollection document.
 *
 * @remarks
 * Satisfies the `DomainClass` interface from effectful-store.
 * `originUserConfigs` maps origin URLs to user-specific settings for that
 * origin (e.g. OAuth account details). Each entry carries a `_tag`
 * discriminant so it can be narrowed to a concrete config type by the
 * corresponding {@link OriginFactory}.
 */
class UserOrg extends Schema.Class<UserOrg>('UserOrg')({
  /** String literal discriminant identifying this as a UserOrg resource. */
  domainType: Schema.optionalWith(Schema.Literal('UserOrg'), {
    default: () => 'UserOrg' as const,
  }),
  /** Firebase URL identifying this user-org document's location in the store. */
  url: Schema.optional(UserOrgUrlSchema),
  /** Map from origin URLs to user-specific configuration for each origin. */
  originUserConfigs: Schema.optionalWith(
    Schema.Record({
      key: UriEncodedOriginUrl,
      value: BaseOriginUserConfig,
    }),
    { default: () => ({}) }
  ),
}) {
  static readonly DomainType = 'UserOrg' as const
  static readonly UrlSchema = UserOrgUrlSchema
  static readonly SearchSchema = {} as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(UserOrg, this)
}

export { BaseOriginUserConfig, UserOrg }
