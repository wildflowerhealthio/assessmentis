import { Schema } from 'effect'

/** Branded string identifying an authenticated user (typically a Firebase UID). */
export const UserId = Schema.String.pipe(Schema.brand('UserUid'))
export type UserId = typeof UserId.Type
