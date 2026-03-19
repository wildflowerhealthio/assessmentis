import { Schema } from 'effect'

export const ApiDailyCoTranscriptSchema = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      transcriptId: Schema.String,
      roomName: Schema.optional(Schema.String),
      mtgSessionId: Schema.optional(Schema.String),
      status: Schema.String,
      duration: Schema.optional(Schema.Number),
    })
  ),
  total_count: Schema.Number,
})
