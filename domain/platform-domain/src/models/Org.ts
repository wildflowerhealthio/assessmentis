import { Schema } from 'effect'

import { UriEncodedOriginUrl } from '@assessmentis/effectful-store'
import { DateTimeUtcFromFirebaseTimestamp } from '@assessmentis/util'

import { BaseOriginDefinition } from './BaseOriginDefinition'
import { OrgSlug } from './IdTypes'

export const Org = Schema.Struct({
  slug: OrgSlug,
  emoji: Schema.String,
  origins: Schema.optionalWith(
    Schema.Record({ key: UriEncodedOriginUrl, value: BaseOriginDefinition }),
    { default: () => ({}) }
  ),
  originConfigs: Schema.optionalWith(
    Schema.Record({ key: UriEncodedOriginUrl, value: Schema.Unknown }),
    { default: () => ({}) }
  ),
  lastRecordingSyncTimestamp: Schema.optional(DateTimeUtcFromFirebaseTimestamp),
  lastTranscriptSyncTimestamp: Schema.optional(
    DateTimeUtcFromFirebaseTimestamp
  ),
  lastSyncError: Schema.optional(Schema.String),
})
export type Org = typeof Org.Type
