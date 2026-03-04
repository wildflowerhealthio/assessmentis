import { Context, Schema, type Effect } from 'effect'

import type {
  AuthError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'

export const RecordingsBucket = Schema.Struct({
  bucket_name: Schema.String,
  bucket_region: Schema.String,
  assume_role_arn: Schema.String,
  allow_api_access: Schema.Boolean,
})
export type RecordingsBucket = typeof RecordingsBucket.Type

export const DailyCoConfig = Schema.TaggedStruct('daily_co', {
  dailyCoProxyUrl: Schema.String,
  recordingsBucket: Schema.optional(RecordingsBucket),
})
export type DailyCoConfig = typeof DailyCoConfig.Type

export class DailyCoContext extends Context.Tag('DailyCoContext')<
  DailyCoContext,
  {
    config: DailyCoConfig
    authHeadersEffect: Effect.Effect<
      Record<string, string>,
      UnhandledError | ExternalAssertionError | AuthError
    >
  }
>() {}
