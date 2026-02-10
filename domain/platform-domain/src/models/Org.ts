import { Schema } from 'effect'
import { FrontendConfig } from './FrontendConfig'
import { OrgSlug } from './IdTypes'

export const Org = Schema.Struct({
  slug: OrgSlug,
  emoji: Schema.String,
  frontendConfig: FrontendConfig,
  lastRecordingSyncTimestamp: Schema.optional(Schema.DateTimeUtc),
  lastTranscriptSyncTimestamp: Schema.optional(Schema.DateTimeUtc),
  lastSyncError: Schema.optional(Schema.String),
})
export type Org = typeof Org.Type
