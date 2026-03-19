import { Schema } from 'effect'

export const ApiDailyCoRecordingLinkSchema = Schema.Struct({
  download_link: Schema.String,
})
