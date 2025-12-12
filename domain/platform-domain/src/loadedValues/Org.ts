import { Schema } from 'effect'
import { FrontendConfig } from './FrontendConfig'
import { OrgSlug } from './IdTypes'
import { CurrentUserError } from './User'

export const Org = Schema.Struct({
  slug: OrgSlug,
  frontendConfig: FrontendConfig,
})
export type Org = typeof Org.Type

export const OrgLoading = Schema.TaggedStruct('OrgLoading', {})
export type OrgLoading = typeof OrgLoading.Type

export const OrgDataError = Schema.TaggedStruct('OrgDataError', {
  cause: Schema.optional(Schema.Unknown),
})
export type OrgDataError = typeof OrgDataError.Type

export const OrgError = Schema.Union(CurrentUserError, OrgLoading, OrgDataError)
export type OrgError = typeof OrgError.Type
