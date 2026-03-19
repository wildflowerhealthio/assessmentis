import { Schema } from 'effect'

const DailyCoResourceType = Schema.Literal('Location', 'Media', 'Observation')

export const RecordingsBucket = Schema.Struct({
  allow_api_access: Schema.Boolean,
  assume_role_arn: Schema.String,
  bucket_name: Schema.String,
  bucket_region: Schema.String,
})
export type RecordingsBucket = typeof RecordingsBucket.Type

export const DailyCoOriginDefinition = Schema.TaggedStruct('daily_co', {
  activeResources: Schema.Record({
    key: DailyCoResourceType,
    value: Schema.Literal(true),
  }),
  dailyCoProxyUrl: Schema.String,
  recordingsBucket: Schema.optional(RecordingsBucket),
})
export type DailyCoOriginDefinition = typeof DailyCoOriginDefinition.Type
