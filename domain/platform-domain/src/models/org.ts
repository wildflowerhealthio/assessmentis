import { Schema } from 'effect'

import { UriEncodedOriginUrl } from '@assessmentis/effectful-store'
import { DateTimeUtcFromFirebaseTimestamp } from '@assessmentis/util'

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

/**
 * Schema for an organization document stored in the `orgs` collection.
 */
export const Org = Schema.Struct({
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
})
export type Org = typeof Org.Type
