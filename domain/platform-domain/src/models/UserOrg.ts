import { Schema } from 'effect'

import { UriEncodedOriginUrl } from '@assessmentis/effectful-store'

/**
 * Base schema for a per-user origin configuration entry.
 *
 * @remarks
 * Uses `onExcessProperty: 'preserve'` so that origin-specific fields
 * (e.g. OAuth tokens) survive decoding even though only `_tag` is
 * declared here. Concrete origin types narrow this further.
 */
const BaseOriginConfig = Schema.Struct({
  _tag: Schema.String,
}).annotations({ parseOptions: { onExcessProperty: 'preserve' } })

/**
 * Per-user, per-org configuration stored as a subcollection document.
 *
 * @remarks
 * `originConfig` maps origin URLs to user-specific settings for that origin
 * (e.g. Auth account details). Each entry carries a `_tag` discriminant so it
 * can be narrowed to a concrete config type by the corresponding
 * {@link OriginType}.
 */
export const UserOrg = Schema.Struct({
  originConfig: Schema.optionalWith(
    Schema.Record({
      key: UriEncodedOriginUrl,
      value: BaseOriginConfig,
    }),
    { default: () => ({}) }
  ),
})
export type UserOrg = typeof UserOrg.Type
