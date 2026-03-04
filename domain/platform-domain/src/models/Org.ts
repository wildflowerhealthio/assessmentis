import { Schema } from 'effect'

import { DateTimeUtcFromFirebaseTimestamp } from '@assessmentis/util'

import { FrontendConfig } from './FrontendConfig'
import { OrgSlug } from './IdTypes'

export const Org = Schema.Struct({
  slug: OrgSlug,
  emoji: Schema.String,
  frontendConfig: FrontendConfig,
  lastRecordingSyncTimestamp: Schema.optional(DateTimeUtcFromFirebaseTimestamp),
  lastTranscriptSyncTimestamp: Schema.optional(
    DateTimeUtcFromFirebaseTimestamp
  ),
  lastSyncError: Schema.optional(Schema.String),
})
export type Org = typeof Org.Type
