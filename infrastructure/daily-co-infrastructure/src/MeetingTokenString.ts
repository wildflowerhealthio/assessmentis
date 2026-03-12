import { Schema } from 'effect'

/**
 * Branded string type for Daily.co meeting tokens (JWT format).
 */
export const MeetingTokenString = Schema.String.pipe(
  Schema.brand('MeetingTokenString')
)

export type MeetingTokenString = typeof MeetingTokenString.Type
