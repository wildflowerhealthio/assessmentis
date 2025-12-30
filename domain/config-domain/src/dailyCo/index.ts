import { Schema } from 'effect'

export const RecordingsBucket = Schema.Struct({
  bucket_name: Schema.String,
  bucket_region: Schema.String,
  assume_role_arn: Schema.String,
  allow_api_access: Schema.Boolean,
})
export type RecordingsBucket = typeof RecordingsBucket.Type

export const DailyCoProxyConfig = Schema.TaggedStruct('daily_co_proxy', {
  dailyCoProxyUrl: Schema.String,
  recordingsBucket: Schema.optional(RecordingsBucket),
})
export type DailyCoProxyConfig = typeof DailyCoProxyConfig.Type
