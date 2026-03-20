import { Schema } from 'effect'

/** Branded string identifying an authenticated user. */
export const UserId = Schema.String.pipe(Schema.brand('UserUid'))
export type UserId = typeof UserId.Type
