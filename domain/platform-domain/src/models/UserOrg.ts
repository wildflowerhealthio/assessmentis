import { Data, Equal, Schema } from 'effect'

import { UriEncodedOriginUrl } from '@assessmentis/effectful-store'

/**
 * Base schema for a per-user origin configuration entry.
 *
 * @remarks
 * Uses `onExcessProperty: 'preserve'` so that origin-specific fields
 * (e.g. OAuth tokens) survive decoding even though only `_tag` is
 * declared here. Concrete origin types narrow this further.
 */
export const BaseOriginUserConfig = Schema.Struct({
  _tag: Schema.String,
}).annotations({
  parseOptions: { onExcessProperty: 'preserve' },
  equivalence: () => (a, b) =>
    a._tag === b._tag && Equal.equals(Data.struct(a), Data.struct(b)),
})

/**
 * Per-user, per-org configuration stored as a subcollection document.
 *
 * @remarks
 * `originUserConfigs` maps origin URLs to user-specific settings for that
 * origin (e.g. OAuth account details). Each entry carries a `_tag`
 * discriminant so it can be narrowed to a concrete config type by the
 * corresponding {@link OriginFactory}.
 */
export const UserOrg = Schema.Struct({
  originUserConfigs: Schema.optionalWith(
    Schema.Record({
      key: UriEncodedOriginUrl,
      value: BaseOriginUserConfig,
    }),
    { default: () => ({}) }
  ),
})
export type UserOrg = typeof UserOrg.Type
