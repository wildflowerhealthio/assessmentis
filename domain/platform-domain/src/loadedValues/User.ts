import { Schema } from 'effect'
import { OrgSlug, Role } from './IdTypes'
import { CurrentUserIdError, UserId } from './UserId'

export const User = Schema.Struct({
  uid: UserId,
  org_roles: Schema.Record({
    key: OrgSlug,
    value: Schema.Array(Role),
  }),
})
export type User = typeof User.Type

export const UserLoading = Schema.TaggedStruct('UserLoading', {})

export type UserLoading = typeof UserLoading.Type

export const UserDataError = Schema.TaggedStruct('UserDataError', {
  cause: Schema.optional(Schema.Unknown),
})
export type UserDataError = typeof UserDataError.Type

export const CurrentUserError = Schema.Union(
  CurrentUserIdError,
  UserLoading,
  UserDataError
)
export type CurrentUserError = typeof CurrentUserError.Type
