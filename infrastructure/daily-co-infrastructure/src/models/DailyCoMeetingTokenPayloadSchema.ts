import { Schema } from 'effect'

/**
 * Schema for the decoded JWT payload of a Daily.co meeting token.
 * Daily.co uses short claim names in their JWTs.
 */
export const DailyCoMeetingTokenPayloadSchema = Schema.Struct({
  /** Room name */
  r: Schema.String,
  /** Is owner */
  o: Schema.Boolean,
})
