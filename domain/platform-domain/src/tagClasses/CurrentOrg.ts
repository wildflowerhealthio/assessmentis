import { Context } from 'effect'
import type { OrgSlug } from '../models/IdTypes'

export class CurrentOrg extends Context.Tag('CurrentOrg')<
  CurrentOrg,
  OrgSlug
>() {}
