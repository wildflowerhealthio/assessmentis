import { Schema } from 'effect'
import { FrontendConfig } from './FrontendConfig'
import { OrgSlug } from './IdTypes'

export const Org = Schema.Struct({
  slug: OrgSlug,
  frontendConfig: FrontendConfig,
})
export type Org = typeof Org.Type
