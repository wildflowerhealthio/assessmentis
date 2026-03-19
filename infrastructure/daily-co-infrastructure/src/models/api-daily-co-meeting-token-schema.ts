import { Schema } from 'effect'

export const ApiDailyCoMeetingTokenSchema = Schema.Struct({
  token: Schema.NonEmptyString,
})
