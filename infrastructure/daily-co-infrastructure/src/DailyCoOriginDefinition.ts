import { Schema } from 'effect'

const DailyCoResourceType = Schema.Literal('Location', 'Media', 'Observation')

export const RecordingsBucket = Schema.Struct({
  bucket_name: Schema.String,
  bucket_region: Schema.String,
  assume_role_arn: Schema.String,
  allow_api_access: Schema.Boolean,
})
export type RecordingsBucket = typeof RecordingsBucket.Type

export const DailyCoOriginDefinition = Schema.TaggedStruct('daily_co', {
  dailyCoProxyUrl: Schema.String,
  recordingsBucket: Schema.optional(RecordingsBucket),
  activeResources: Schema.Record({
    key: DailyCoResourceType,
    value: Schema.Literal(true),
  }),
})
export type DailyCoOriginDefinition = typeof DailyCoOriginDefinition.Type
