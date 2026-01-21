import { Schema } from 'effect'
import { OrgSlug, Role } from './IdTypes'
import { UserId } from './UserId'

export const User = Schema.Struct({
  uid: UserId,
  org_roles: Schema.Record({
    key: OrgSlug,
    value: Schema.Array(Role),
  }),
})
export type User = typeof User.Type
