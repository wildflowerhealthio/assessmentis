import { Schema } from 'effect'

export const UserId = Schema.String.pipe(Schema.brand('UserUid'))
export type UserId = typeof UserId.Type

export const AuthStateError = Schema.TaggedStruct('AuthStateError', {
  cause: Schema.optional(Schema.Unknown),
})
export type AuthStateError = typeof AuthStateError.Type

export const AuthStateLoading = Schema.TaggedStruct('AuthStateLoading', {})
export type AuthStateLoading = typeof AuthStateLoading.Type

export const NotLoggedIn = Schema.TaggedStruct('NotLoggedIn', {})
export type NotLoggedIn = typeof NotLoggedIn.Type

export const CurrentUserIdError = Schema.Union(
  AuthStateLoading,
  AuthStateError,
  NotLoggedIn
)
export type CurrentUserIdError = typeof CurrentUserIdError.Type
