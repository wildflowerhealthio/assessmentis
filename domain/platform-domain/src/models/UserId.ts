import { Schema } from 'effect'

export const UserId = Schema.String.pipe(Schema.brand('UserUid'))
export type UserId = typeof UserId.Type

export const AuthStateError = Schema.TaggedStruct('AuthStateError', {
  cause: Schema.optional(Schema.Unknown),
})
export type AuthStateError = typeof AuthStateError.Type
