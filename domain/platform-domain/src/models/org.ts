import { Schema, pipe } from 'effect'

import { ReadonlyUrl, UriEncodedOriginUrl } from '@assessmentis/effectful-store'
import type { Search } from '@assessmentis/effectful-store'
import { DateTimeUtcFromFirebaseTimestamp, makeCloneWith } from '@assessmentis/util'

import { BaseOriginDefinition } from './base-origin-definition'
import { OrgSlug } from './id-types'

/**
 * Base schema for an org-level origin configuration entry.
 *
 * @remarks
 * Uses `onExcessProperty: 'preserve'` so that origin-specific fields
 * survive decoding even though only `_tag` is declared here.
 * Mirrors the per-user `BaseOriginUserConfig` in {@link UserOrg}.
 */
const BaseOriginServerConfig = Schema.Struct({
  _tag: Schema.String,
}).annotations({ parseOptions: { onExcessProperty: 'preserve' } })

const OrgUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('Org/url'))

/**
 * Organization document stored in the `orgs` collection.
 *
 * @remarks
 * Satisfies the `DomainClass` interface from effectful-store so orgs can
 * be served through the Hub alongside clinical resources. The `domainType`
 * field defaults to `'Org'` and `url` is optional, so existing Firestore
 * documents decode without changes.
 */
export class Org extends Schema.Class<Org>('Org')({
  /** String literal discriminant identifying this as an Org resource. */
  domainType: Schema.optionalWith(Schema.Literal('Org'), {
    default: () => 'Org' as const,
  }),
  /** Branded URL identifying this org's location in the store. Set by the resolver. */
  url: Schema.optional(OrgUrlSchema),
  /** URL-safe unique identifier for the org (e.g. `"acme"`). Used in paths and URLs. */
  slug: OrgSlug,
  /** Emoji displayed alongside the org name in the UI. */
  emoji: Schema.String,
  /**
   * Map from URI-encoded origin URLs to their org-level definitions.
   * Each entry describes an external data source (e.g. an EHR) the org has configured.
   */
  origins: Schema.optionalWith(
    Schema.Record({ key: UriEncodedOriginUrl, value: BaseOriginDefinition }),
    { default: () => ({}), exact: true }
  ),
  /**
   * Map from URI-encoded origin URLs to org-level server configuration for that
   * origin (e.g. admin API keys). Each entry carries a `_tag` discriminant for
   * narrowing to a concrete config type.
   */
  originServerConfigs: Schema.optionalWith(
    Schema.Record({ key: UriEncodedOriginUrl, value: BaseOriginServerConfig }),
    { default: () => ({}), exact: true }
  ),
  /** Timestamp of the last successful recording sync from external origins. */
  lastRecordingSyncTimestamp: Schema.optional(DateTimeUtcFromFirebaseTimestamp),
  /** Timestamp of the last successful transcript sync from external origins. */
  lastTranscriptSyncTimestamp: Schema.optional(DateTimeUtcFromFirebaseTimestamp),
  /** Human-readable error message from the most recent failed sync attempt, if any. */
  lastSyncError: Schema.optional(Schema.String),
}) {
  static readonly DomainType = 'Org' as const
  static readonly UrlSchema = OrgUrlSchema
  static readonly SearchSchema = {} as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(Org, this)
}
